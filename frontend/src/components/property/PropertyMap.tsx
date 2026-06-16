interface PropertyMapProps {
  lat: number;
  lng: number;
  address: string;
}

export default function PropertyMap({ lat, lng, address }: PropertyMapProps) {
  return (
    <iframe
      src={`https://yandex.ru/map-widget/v1/?ll=${lng}%2C${lat}&z=16&pt=${lng},${lat},pm2rdm`}
      width="100%"
      height="360"
      style={{ border: 0, display: "block" }}
      title={`Карта: ${address}`}
      loading="lazy"
    />
  );
}
