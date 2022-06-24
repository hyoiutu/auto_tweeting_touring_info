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

export function thinOut<T>(arr: Array<T>, thinOutRatio: number) {
  return arr.filter((_, i) => i % thinOutRatio === 0);
}

export function uniq<T>(arr: Array<T>) {
  return [...new Set(arr)];
}

export function excludeUndef<T>(arr: Array<T | undefined>) {
  return arr.filter((v): v is Exclude<typeof v, undefined> => v !== undefined);
}

export function days(aDate: Date, bDate: Date) {
  return Math.floor(
    Math.abs(bDate.getTime() - aDate.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function splitString(target: string, strNum: number, splitChar: string) {
  const result = [];
  let remain = target;
  while (remain.length > strNum) {
    const indexCandidate = remain.substring(0, strNum).lastIndexOf(splitChar);
    const lastIndex = indexCandidate === -1 ? strNum : indexCandidate;
    result.push(remain.substring(0, strNum));

    remain = remain.substring(lastIndex + 1);
  }

  if (result.length === 0) {
    result.push(remain);
  }

  return result;
}
