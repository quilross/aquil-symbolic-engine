/**
 * Values Clarifier - Helps identify and prioritize core values
 */

export class ValuesClarifier {
  constructor(env) {
    this.env = env;
  }

  async clarify(data) {
    const { values_list = [] } = data;
    return {
      message: "Values clarified.",
      prioritized_values: values_list,
    };
  }
}
