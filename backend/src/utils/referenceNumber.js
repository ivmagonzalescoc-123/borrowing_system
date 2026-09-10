function generateReferenceNo() {
  const digits = Math.floor(Math.random() * 1e10)
    .toString()
    .padStart(10, '0');
  return `BR-${digits}`;
}

module.exports = { generateReferenceNo };
