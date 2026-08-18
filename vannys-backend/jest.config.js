/**
 * Tests unitaires — règles de calcul et de validation, sans base de données.
 * Les cas qui touchent Prisma sont couverts par des doubles, pas par une base
 * de test : le dépôt n'en a pas, et une règle métier se vérifie sans elle.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\.spec\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
};
