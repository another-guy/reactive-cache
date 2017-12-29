export function objectKeyToStringKey(key: any): string {
  if (key === null) throw new Error(`Null keys are not allowed`);

  // Primitive types can be translated in a direct way.
  if (typeof key !== 'object') return key.toString();

  // Non-primitive types ([] and {}) must sort their properties
  // in order to normalize the structure of the generated string representation of the key.
  const stringKey = Object
    .keys(key)
    .sort((property1, property2) => property1.localeCompare(property2))
    .map(property => `${property}=${key[property]}`)
    .join('|');

  if (stringKey == null || stringKey.length <= 0) {
    const toText = JSON.stringify;
    throw new Error(`Translated key is invalid for being a property name. ${ toText(key) } -> ${ toText(stringKey) }`);
  }

  return stringKey;
}
