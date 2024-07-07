export const nonNullableFilter = <T>(value: T): value is NonNullable<typeof value> => value != null;
