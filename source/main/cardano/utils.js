// @flow
const checkCondition = async (
  condition: () => boolean,
  timeout: number,
  retryEvery: number,
  timeWaited: number = 0
): Promise<void> => {
  const result = await condition();
  if (!result) {
    if (timeWaited >= timeout) {
      throw new Error('Condition not met in time');
    } else {
      setTimeout(() => checkCondition(
        condition, timeout, retryEvery, timeWaited + retryEvery
      ), retryEvery);
    }
  }
};

export const promisedCondition = async (
  cond: Function, timeout: number = 5000, retryEvery: number = 1000
): Promise<void> => await checkCondition(cond, timeout, retryEvery);
