import {
  days,
  eachSlice,
  excludeUndef,
  getMaxByPrimitive,
  getMinByPrimitive,
  splitString,
  thinOut,
  uniq,
} from "./util";

describe("util.ts", () => {
  describe("eachSlice", () => {
    describe("指定したnで割り切れない場合", () => {
      it("例外が投げられる", () => {
        expect(() => {
          eachSlice([1, 2, 3, 4, 5], 2);
        }).toThrow("final element length less than 2");
      });
    });
    describe("指定したnで割り切れる場合", () => {
      it("n毎に分かれた配列が配列になって返ってくる", () => {
        expect(eachSlice([1, 2, 3, 4, 5, 6], 2)).toStrictEqual([
          [1, 2],
          [3, 4],
          [5, 6],
        ]);
      });
    });
  });
  describe("getMaxByPrimitive", () => {
    describe("第二引数未指定で第一引数の配列がnumber型以外の場合", () => {
      it("例外が返ってくる", () => {
        expect(() => {
          getMaxByPrimitive(["a", "b", "c"]);
        }).toThrow("getMaxMyPrimitive getTargetFn arg must be number");
      });
    });
    describe("第二引数にnumber型を返す関数を渡す場合", () => {
      const example = [
        { a: 2, b: 9 },
        { a: 4, b: 7 },
        { a: 3, b: 5 },
        { a: 1, b: 10 },
      ];
      it("第二引数で指定した関数通りに比較して第一引数の中でも最も大きい値を取り出す", () => {
        expect.assertions(2);
        expect(getMaxByPrimitive(example, (o) => o.a)).toStrictEqual({
          a: 4,
          b: 7,
        });
        expect(getMaxByPrimitive(example, (o) => o.b)).toStrictEqual({
          a: 1,
          b: 10,
        });
      });
    });
  });
  describe("getMinByPrimitive", () => {
    describe("第二引数未指定で第一引数の配列がnumber型以外の場合", () => {
      it("例外が返ってくる", () => {
        expect(() => {
          getMinByPrimitive(["a", "b", "c"]);
        }).toThrow("getMinMyPrimitive getTargetFn arg must be number");
      });
    });
    describe("第二引数にnumber型を返す関数を渡す場合", () => {
      const example = [
        { a: 23, b: 223 },
        { a: 12, b: 543 },
        { a: 64, b: 12 },
        { a: 32, b: 1233 },
      ];
      it("第二引数で指定した関数通りに比較して第一引数の中でも最も小さい値を取り出す", () => {
        expect.assertions(2);
        expect(getMinByPrimitive(example, (o) => o.a)).toStrictEqual({
          a: 12,
          b: 543,
        });
        expect(getMinByPrimitive(example, (o) => o.b)).toStrictEqual({
          a: 64,
          b: 12,
        });
      });
    });
  });
  describe("thinOut", () => {
    let example: number[];
    beforeEach(() => {
      example = [...Array(10000)].map((_, i) => i);
    });
    it("配列を指定の間隔で間引く", () => {
      expect(thinOut(example, 1000)).toStrictEqual([
        0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000,
      ]);
    });
  });
  describe("uniq", () => {
    const example = { a: "a", b: "b" };
    it("配列から重複を取り除く", () => {
      expect.assertions(3);
      expect(
        uniq([0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5])
      ).toStrictEqual([0, 1, 2, 3, 4, 5]);
      expect(
        uniq([
          { a: "a", b: "b" },
          { b: "b", a: "a" },
          { a: "a", b: "b" },
        ])
      ).toStrictEqual([
        { a: "a", b: "b" },
        { b: "b", a: "a" },
        { a: "a", b: "b" },
      ]);
      expect(uniq([example, example, example])).toStrictEqual([example]);
    });
  });
  describe("excludeUndef", () => {
    it("配列からundefinedを取り除く", () => {
      expect.assertions(2);
      expect(
        excludeUndef([0, undefined, undefined, undefined, undefined, 5])
      ).toStrictEqual([0, 5]);
      expect(
        excludeUndef([
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
        ])
      ).toStrictEqual([]);
    });
  });
  describe("days", () => {
    describe("日付のみを指定した場合", () => {
      it("日付の差分を返す", () => {
        expect(days(new Date("2022-06-01"), new Date("2022-06-02"))).toBe(1);
      });
    });
    describe("時間指定によって24時間未満の場合", () => {
      it("差分は1日未満 = 0で返ってくる", () => {
        expect(
          days(new Date("2022-06-01 00:00:01"), new Date("2022-06-02 00:00:00"))
        ).toBe(0);
      });
    });
    describe("月をまたぐ場合", () => {
      it("その月の終わりを考慮した差分が返ってくる", () => {
        expect(days(new Date("2022-03-01"), new Date("2022-02-28"))).toBe(1);
      });
    });
    describe("うるう年で2月と3月をまたぐ場合", () => {
      it("うるう年を考慮した差分が返ってくる", () => {
        expect(days(new Date("2020-03-01"), new Date("2020-02-28"))).toBe(2);
      });
    });
  });
  describe("splitString", () => {
    const example = "aaa,bbb,ccc,ddd,eee,fff,ggg,hhh,iii";
    it("第二引数に指定した文字数に最も近くなるように第三引数の文字で分割した文字列が配列で返ってくる", () => {
      expect(splitString(example, 9, ",")).toStrictEqual([
        "aaa,bbb,",
        "ccc,ddd,",
        "eee,fff,",
        "ggg,hhh,",
        "iii",
      ]);
    });
    describe("指定の文字が見つからない場合", () => {
      it("指定した文字数で区切る", () => {
        expect(splitString(example, 9, ".")).toStrictEqual([
          "aaa,bbb,c",
          "cc,ddd,ee",
          "e,fff,ggg",
          ",hhh,iii",
        ]);
      });
      describe("指定した文字が一部見つかって一部見つからない場合", () => {
        it("見つかる部分はそこで区切り、見つからない部分は指定文字数で区切る", () => {
          expect(splitString(example, 9, "b")).toStrictEqual([
            "aaa,bbb",
            ",ccc,ddd,",
            "eee,fff,g",
            "gg,hhh,ii",
            "i",
          ]);
        });
      });
    });
  });
});
