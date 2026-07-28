export function databaseSslOptions(
  enabled?: string,
  rejectUnauthorized?: string,
) {
  if (enabled?.toLowerCase() !== 'true') {
    return undefined;
  }

  return {
    rejectUnauthorized: rejectUnauthorized?.toLowerCase() !== 'false',
  };
}
