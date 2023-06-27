export type Category =
  | '한식'
  | '양식'
  | '경양식'
  | '중식'
  | '중국식'
  | '일식'
  | '양식'
  | '기타'
  | '분식'
  | '까페'
  | '통닭'
  | '식육'
  | '횟집'
  | '인도'
  | '패스트푸드'
  | '패밀리레스트랑'
  | '김밥(도시락)'
  | '소주방';

const categoryList: Category[] = [
  '한식',
  '양식',
  '중식',
  '일식',
  '양식',
  '기타',
  '분식',
  '까페',
  '통닭',
  '식육',
  '횟집',
  '인도',
  '패스트푸드',
  '패밀리레스트랑',
  '김밥(도시락)',
  '소주방',
];

export function validateCategory(keyword: string): boolean {
  const validatedKeyword: Category = keyword as Category;
  return categoryList.includes(validatedKeyword);
}
