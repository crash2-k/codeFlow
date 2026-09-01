/**
 * Examples - Sample code for learning
 */
export const EXAMPLES = [
    {
        name: 'Hello World',
        description: 'Basic output with console.log',
        code: `console.log("Hello, World!");`
    },
    {
        name: 'Variables',
        description: 'Declaring and using variables',
        code: `let x = 10;
let y = 20;
let z = x + y;
console.log(z);`
    },
    {
        name: 'If Statement',
        description: 'Conditional logic with if/else',
        code: `let age = 25;
if (age >= 18) {
    console.log("Adult");
} else {
    console.log("Minor");
}`
    },
    {
        name: 'For Loop',
        description: 'Iterating with a for loop',
        code: `for (let i = 1; i <= 5; i = i + 1) {
    console.log(i);
}`
    },
    {
        name: 'Array Operations',
        description: 'Working with arrays',
        code: `let arr = [1, 2, 3, 4, 5];
let sum = 0;
for (let i = 0; i < 5; i = i + 1) {
    sum = sum + arr[i];
}
console.log(sum);`
    },
    {
        name: 'Function',
        description: 'Defining and calling functions',
        code: `function greet(name) {
    return "Hello, " + name;
}

let message = greet("World");
console.log(message);`
    },
    {
        name: 'Simple Calculation',
        description: 'Basic arithmetic operations',
        code: `let a = 15;
let b = 4;
let sum = a + b;
let product = a * b;
let difference = a - b;
console.log(sum);
console.log(product);
console.log(difference);`
    },
    {
        name: 'While Loop',
        description: 'Iterating with a while loop',
        code: `let count = 1;
while (count <= 5) {
    console.log(count);
    count = count + 1;
}`
    },
    {
        name: 'Factorial',
        description: 'Calculate factorial of a number',
        code: `function factorial(n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

let result = factorial(5);
console.log(result);`
    },
    {
        name: 'Nested Loops',
        description: 'Loop inside another loop',
        code: `for (let i = 1; i <= 3; i = i + 1) {
    for (let j = 1; j <= 3; j = j + 1) {
        console.log(i * j);
    }
}`
    },
    {
        name: 'Object',
        description: 'Working with objects',
        code: `let person = {
    name: "Alice",
    age: 30,
    city: "New York"
};

console.log(person.name);
console.log(person.age);`
    },
    {
        name: 'String Concatenation',
        description: 'Working with strings',
        code: `let firstName = "John";
let lastName = "Doe";
let fullName = firstName + " " + lastName;
console.log(fullName);`
    }
];
