export const handleApiResponse = async (res, defaultMessage) => {
  const result = await res.json();

  if (
    !res.ok ||
    result.success === false ||
    (result.statusCode && result.statusCode > 299)
  ) {
    const backendMessage = result?.message || result?.title || defaultMessage;

    throw new Error(`${backendMessage}`);
  }

  return result;
};
