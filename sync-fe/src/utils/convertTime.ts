export default (totalTime: number) => {
  const hours = Math.floor(totalTime / 3600);
  const mins = Math.floor((totalTime - hours * 3600) / 60);
  const seconds = totalTime - hours * 3600 - mins * 60;
  console.log({ totalTime, hours, mins, seconds });
  let res = '';
  if (hours) {
    res += `${hours}:`;
  }
  res += `${mins.toString().padStart(2, '0')}:`;
  res += `${seconds.toString().padStart(2, '0')}`;

  return res;
};
