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
