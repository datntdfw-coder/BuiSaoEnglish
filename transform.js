const fs = require('fs');

const data = fs.readFileSync('src/app/mockData.ts', 'utf-8');

// We will extract mockQuestions, mockQuestions2, mockQuestions3, mockQuestions4, mockQuestions5
const extractArray = (varName) => {
  const start = data.indexOf(`export const ${varName} = [`);
  if (start === -1) return null;
  const end = data.indexOf('];', start);
  const arrayStr = data.substring(start + `export const ${varName} = `.length, end + 1);
  return eval(arrayStr);
};

const q1 = extractArray('mockQuestions') || [];
const q2 = extractArray('mockQuestions2') || [];
const q3 = extractArray('mockQuestions3') || [];
const q4 = extractArray('mockQuestions4') || [];
const q5 = extractArray('mockQuestions5') || [];

let allSchoolQuestions = [...q1, ...q2, ...q3, ...q4, ...q5].filter(q => q && q.question);

// Transform fill_blank to multiple_choice
allSchoolQuestions = allSchoolQuestions.map((q, idx) => {
  q.id = idx + 1; // re-id
  if (q.type === 'fill_blank') {
    q.type = 'multiple_choice';
    const ans = q.correctAnswer;
    q.options = [ans, "something else", "incorrect option", "not given"].sort(() => Math.random() - 0.5);
  }
  if (!q.options && ['multiple_choice', 'reading_comprehension'].includes(q.type)) {
     q.options = [q.correctAnswer, "Option B", "Option C", "Option D"];
  }
  return q;
});

// We need 4 tests of 30 for School = 120 questions.
const schoolTests = [];
for (let i = 0; i < 4; i++) {
  schoolTests.push(allSchoolQuestions.slice(i * 30, (i + 1) * 30));
}

// Write to schoolTests.ts
let out = `export const schoolTest1 = ${JSON.stringify(schoolTests[0], null, 2)};\n`;
out += `export const schoolTest2 = ${JSON.stringify(schoolTests[1], null, 2)};\n`;
out += `export const schoolTest3 = ${JSON.stringify(schoolTests[2], null, 2)};\n`;
out += `export const schoolTest4 = ${JSON.stringify(schoolTests[3], null, 2)};\n`;

fs.writeFileSync('src/app/schoolTests.ts', out);
console.log('Generated schoolTests.ts with 4 tests');
