// Configuration globale pour les tests visuels
beforeAll(() => {
  // Augmenter le timeout pour les tests visuels
  jest.setTimeout(60000);
});

afterAll(() => {
  // Nettoyage global si nécessaire
  console.log('Tests visuels terminés');
});