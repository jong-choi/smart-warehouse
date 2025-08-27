import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const mathTool = tool(
  async ({ numbers, operation }) => {
    try {
      if (!numbers || numbers.length === 0) {
        return "Error: Please provide at least one number.";
      }

      if (!numbers.every((n) => typeof n === "number" && isFinite(n))) {
        return "Error: All elements must be valid finite numbers.";
      }

      let result: number;

      switch (operation) {
        case "add":
          result = numbers.reduce((sum, num) => sum + num, 0);
          break;

        case "subtract":
          if (numbers.length < 2) {
            return "Error: Subtraction requires at least 2 numbers.";
          }
          result = numbers.reduce((diff, num, index) =>
            index === 0 ? num : diff - num
          );
          break;

        case "multiply":
          result = numbers.reduce((product, num) => product * num, 1);
          break;

        case "divide":
          if (numbers.length < 2) {
            return "Error: Division requires at least 2 numbers.";
          }
          if (numbers.slice(1).some((num) => num === 0)) {
            return "Error: Division by zero is not allowed.";
          }
          result = numbers.reduce((quotient, num, index) =>
            index === 0 ? num : quotient / num
          );
          break;

        case "average":
          result = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
          break;

        case "min":
          result = Math.min(...numbers);
          break;

        case "max":
          result = Math.max(...numbers);
          break;

        case "sum":
          result = numbers.reduce((sum, num) => sum + num, 0);
          break;

        case "product":
          result = numbers.reduce((product, num) => product * num, 1);
          break;

        case "count":
          result = numbers.length;
          break;

        default:
          return `Error: Unknown operation '${operation}'. Supported operations: add, subtract, multiply, divide, average, min, max, sum, product, count`;
      }

      if (!isFinite(result)) {
        return "Error: Calculation resulted in infinity or NaN.";
      }

      const formattedResult = Number.parseFloat(result.toFixed(10));

      const numbersStr = numbers.join(", ");
      const operationDesc = {
        add: `Adding ${numbersStr}`,
        subtract: `Subtracting from ${numbers[0]}: ${numbers
          .slice(1)
          .join(", ")}`,
        multiply: `Multiplying ${numbersStr}`,
        divide: `Dividing ${numbers[0]} by: ${numbers.slice(1).join(", ")}`,
        average: `Average of ${numbersStr}`,
        min: `Minimum of ${numbersStr}`,
        max: `Maximum of ${numbersStr}`,
        sum: `Sum of ${numbersStr}`,
        product: `Product of ${numbersStr}`,
        count: `Count of numbers`,
      }[operation];

      return `${operationDesc} = ${formattedResult}`;
    } catch (error) {
      return `Calculation error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
    }
  },
  {
    name: "math_calculator",
    description:
      "Performs mathematical operations on arrays of numbers. Supports various operations like add, subtract, multiply, divide, average, min, max, sum, product, and count.",
    schema: z.object({
      numbers: z
        .array(z.number())
        .describe(
          "Array of numbers to perform the operation on (e.g., [10, 5, 2])"
        ),
      operation: z
        .enum([
          "add",
          "subtract",
          "multiply",
          "divide",
          "average",
          "min",
          "max",
          "sum",
          "product",
          "count",
        ])
        .describe(
          "Operation to perform: add (addition), subtract (sequential subtraction), multiply (multiplication), divide (sequential division), average (mean), min (minimum), max (maximum), sum (addition), product (multiplication), count (count of numbers)"
        ),
    }),
  }
);
