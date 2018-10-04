let
  localLib = import ./lib.nix;
in
{ system ? builtins.currentSystem
, config ? {}
, pkgs ? (import (localLib.fetchNixPkgs) { inherit system config; })
, cluster ? "demo"
, autoStartBackend ? false
, systemStart ? null
}:

let
  yaml2json = pkgs.haskell.lib.disableCabalFlag pkgs.haskellPackages.yaml "no-exe";
  daedalusPkgs = import ./. { inherit system config pkgs; };
  yarn = pkgs.yarn.override { inherit nodejs; };
  nodejs = pkgs.nodejs-8_x;
  daedalus-config = if cluster == "demo"
    then demoConfig
    else daedalusPkgs.${cluster}.daedalus-config;
  launcher-json = pkgs.runCommand "read-launcher-config.json" { buildInputs = [ yaml2json ]; } "yaml2json ${daedalus-config}/launcher-config.yaml > $out";
  launcher-config = builtins.fromJSON (builtins.readFile launcher-json);
  patches = builtins.concatLists [
    (pkgs.lib.optional (systemStart != null) ".configuration.systemStart = ${toString systemStart}")
    (pkgs.lib.optional (cluster == "demo") ''.configuration.key = "default"'')
  ];
  patchesString = pkgs.lib.concatStringsSep " | " patches;
  launcherYamlWithStartTime = pkgs.runCommand "launcher-config.yaml" { buildInputs = [ pkgs.jq yaml2json ]; } ''
    jq '${patchesString}' < ${launcher-json} | json2yaml > $out
  '';
  launcherConfig' = if (patches == []) then "${daedalus-config}/launcher-config.yaml" else launcherYamlWithStartTime;
  fixYarnLock = pkgs.stdenv.mkDerivation {
    name = "fix-yarn-lock";
    buildInputs = [ nodejs yarn pkgs.git ];
    shellHook = ''
      git diff > pre-yarn.diff
      yarn
      git diff > post-yarn.diff
      diff pre-yarn.diff post-yarn.diff > /dev/null
      if [ $? != 0 ]
      then
        echo "Changes by yarn have been made. Please commit them."
      else
        echo "No changes were made."
      fi
      rm pre-yarn.diff post-yarn.diff
      exit
    '';
  };
  demoTopology = {
    wallet = {
      fallbacks = 7;
      valency = 1;
      relays = [
        [ { addr = "127.0.0.1"; port = 3100; } ]
      ];
    };
  };
  demoTopologyYaml = pkgs.runCommand "wallet-topology.yaml" { buildInputs = [ pkgs.jq yaml2json ]; } ''
    cat ${builtins.toFile "wallet-topology.json" (builtins.toJSON demoTopology)} | json2yaml > $out
  '';
  demoConfig = pkgs.runCommand "new-config" {} ''
    mkdir $out
    cp ${daedalusPkgs.mainnet.daedalus-config}/* $out/
    rm $out/wallet-topology.yaml
    cp ${demoTopologyYaml} $out/wallet-topology.yaml
  '';
  daedalusShell = pkgs.stdenv.mkDerivation {
    name = "daedalus";
    buildInputs = [ nodejs yarn ] ++ (with pkgs; [
      nix bash binutils coreutils curl gnutar
      git python27 curl electron
      nodePackages.node-gyp nodePackages.node-pre-gyp
      gnumake
    ] ++ (localLib.optionals autoStartBackend [
      daedalusPkgs.daedalus-bridge
    ]));
    LAUNCHER_CONFIG = launcherConfig';
    DAEDALUS_CONFIG = daedalus-config;
    DAEDALUS_DIR = "./";
    CLUSTER = cluster;
    shellHook = let
      secretsDir = if pkgs.stdenv.isLinux then "Secrets" else "Secrets-1.0";
      systemStartString = builtins.toString systemStart;
    in ''
      ${localLib.optionalString pkgs.stdenv.isLinux "export XDG_DATA_HOME=$HOME/.local/share"}
      ln -svf $(type -P cardano-node)
      ${pkgs.lib.optionalString autoStartBackend ''
        for x in wallet-topology.yaml configuration.yaml mainnet-genesis-dryrun-with-stakeholders.json ; do
          ln -svf ${daedalus-config}/$x
        done
        ${pkgs.lib.optionalString (cluster == "demo") ''
          ln -svf ${demoTopologyYaml} wallet-topology.yaml
          if [[ -f "${launcher-config.statePath}/system-start" && "${systemStartString}" == $(cat "${launcher-config.statePath}/system-start") ]]
          then
            echo "running pre-existing demo cluster matching system start: ${systemStartString}"
          else
            echo "removing pre-existing demo cluster because system-start differs or doesn't exist"
            rm -rf "${launcher-config.statePath}"
            mkdir -p "${launcher-config.statePath}"
            echo -n ${systemStartString} > "${launcher-config.statePath}/system-start"
          fi
        ''}
        mkdir -p "${launcher-config.statePath}/${secretsDir}"
      ''}
        ${localLib.optionalString autoStartBackend ''
          mkdir -p "${launcher-config.tlsPath}/server" "${launcher-config.tlsPath}/client"
          cardano-x509-certificates \
          --server-out-dir "${launcher-config.tlsPath}/server" \
          --clients-out-dir "${launcher-config.tlsPath}/client" \
          --configuration-file ${daedalus-config}/configuration.yaml \
          --configuration-key mainnet_dryrun_full
          echo ${launcher-config.tlsPath}
        ''
      }
      export DAEDALUS_INSTALL_DIRECTORY="$DAEDALUS_DIR"
      export NIX_CFLAGS_COMPILE="$NIX_CFLAGS_COMPILE -I${nodejs}/include/node"
      yarn install
      ln -svf ${pkgs.electron}/bin/electron ./node_modules/electron/dist/electron
      ${localLib.optionalString (! autoStartBackend) ''
      echo "Instructions for manually running cardano-node:"
      echo "In cardano repo run scripts/launch/demo-nix.sh"
      echo "export CARDANO_TLS_PATH=/path/to/cardano-sl/state-demo/tls/client"
      echo "yarn dev"
      ''}
    '';
  };
  daedalus = daedalusShell.overrideAttrs (oldAttrs: {
    shellHook = ''
       if [ ! -f "$CARDANO_TLS_PATH/ca.crt" ] || [ ! -f "tls/client/ca.crt" ]
       then
         echo "CARDANO_TLS_PATH must be set"
         exit 1
       fi
      ${oldAttrs.shellHook}
      yarn dev
      exit 0
    '';
  });
in daedalusShell // { inherit fixYarnLock; }
