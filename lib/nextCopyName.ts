export function nextCopyName(title: string, existingTitles: string[]): string {
  const baseName = title.replace(/_[0-9]+$/, "");
  let highestNumber = "0";

  for (const existingTitle of existingTitles) {
    const match = /^(.*)_([0-9]+)$/.exec(existingTitle);
    if (match?.[1] !== baseName) continue;

    const number = match[2].replace(/^0+(?=\d)/, "");
    if (
      number.length > highestNumber.length ||
      (number.length === highestNumber.length && number > highestNumber)
    ) {
      highestNumber = number;
    }
  }

  const nextNumber = highestNumber.split("");
  let carry = 1;

  for (let index = nextNumber.length - 1; index >= 0 && carry; index -= 1) {
    const digit = nextNumber[index].charCodeAt(0) - 48 + carry;
    nextNumber[index] = String(digit % 10);
    carry = digit === 10 ? 1 : 0;
  }

  return `${baseName}_${carry ? `1${nextNumber.join("")}` : nextNumber.join("")}`;
}
