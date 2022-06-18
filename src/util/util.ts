export function eachSlice<T>(arr: Array<T>, n: number) {
  let length = arr.length;
  if (length % n !== 0) {
    throw new Error(`final element length less than ${n}`);
  }
  const result: Array<Array<T>> = [];
  while (length > 0) {
    result.push(arr.splice(0, n));
    length = arr.length;
  }
  return result;
}

export function getMaxByPrimitive<T>(
  arr: Array<T>,
  getTargetFn: (arg: T) => number = (arg: T) => {
    if (typeof arg !== "number") {
      throw new TypeError("getMaxMyPrimitive getTargetFn arg must be number");
    }
    return arg;
  }
) {
  let max = Number.NEGATIVE_INFINITY;
  let maxI = 0;
  for (let i = 0, len = arr.length; i < len; ++i) {
    if (max < getTargetFn(arr[i])) {
      max = getTargetFn(arr[i]);
      maxI = i;
    }
  }
  return arr[maxI];
}

export function getMinByPrimitive<T>(
  arr: Array<T>,
  getTargetFn: (arg: T) => number = (arg: T) => {
    if (typeof arg !== "number") {
      throw new TypeError("getMinMyPrimitive getTargetFn arg must be number");
    }
    return arg;
  }
) {
  let min = Number.POSITIVE_INFINITY;
  let minI = 0;
  for (let i = 0, len = arr.length; i < len; ++i) {
    if (min > getTargetFn(arr[i])) {
      min = getTargetFn(arr[i]);
      minI = i;
    }
  }
  return arr[minI];
}
