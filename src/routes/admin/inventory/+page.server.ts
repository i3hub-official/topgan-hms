import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const inventoryItems = [
    {
      id: 1,
      name: 'Twin Sheets Set',
      category: 'Linens',
      quantity: 45,
      unit: 'sets',
      minStock: 20,
      maxStock: 100,
      location: 'Warehouse A',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Bath Towels',
      category: 'Linens',
      quantity: 15,
      unit: 'pieces',
      minStock: 30,
      maxStock: 150,
      location: 'Warehouse A',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Mini Shampoo',
      category: 'Amenities',
      quantity: 200,
      unit: 'bottles',
      minStock: 50,
      maxStock: 300,
      location: 'Warehouse B',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 4,
      name: 'Coffee Pods',
      category: 'Beverages',
      quantity: 80,
      unit: 'pods',
      minStock: 40,
      maxStock: 200,
      location: 'Kitchen Storage',
      lastUpdated: new Date().toISOString()
    }
  ];

  return { items: inventoryItems };
};