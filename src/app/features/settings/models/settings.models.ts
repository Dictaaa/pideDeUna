export interface RestaurantSettings {
  restaurantId: string;
  acceptOrders: boolean;
  acceptReservations: boolean;
  allowCustomerOrdering: boolean;
  allowWaiterCalls: boolean;
  allowOnlinePayment: boolean;
  allowTips: boolean;
  showPrices: boolean;
  showVideos: boolean;
  showAllergens: boolean;
  showIngredients: boolean;
}

export const SETTINGS_TOGGLES: { key: keyof Omit<RestaurantSettings, 'restaurantId'>; label: string }[] = [
  { key: 'acceptOrders', label: 'Aceptar pedidos' },
  { key: 'acceptReservations', label: 'Aceptar reservas' },
  { key: 'allowCustomerOrdering', label: 'El cliente puede pedir desde su celular' },
  { key: 'allowWaiterCalls', label: 'Permitir llamar al mesero desde el QR' },
  { key: 'allowOnlinePayment', label: 'Permitir pago en línea' },
  { key: 'allowTips', label: 'Permitir propina' },
  { key: 'showPrices', label: 'Mostrar precios en el menú' },
  { key: 'showVideos', label: 'Mostrar videos de producto' },
  { key: 'showAllergens', label: 'Mostrar alérgenos' },
  { key: 'showIngredients', label: 'Mostrar ingredientes' },
];
