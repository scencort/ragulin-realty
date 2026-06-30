interface PropertyMapProps {
  lat?: number;
  lng?: number;
  address: string;
}

export default function PropertyMap({ address }: PropertyMapProps) {
  const query = encodeURIComponent(address);
  return (
    <iframe
      src={`https://yandex.ru/map-widget/v1/?text=${query}&z=16`}
      width="100%"
      height="360"
      style={{ border: 0, display: "block" }}
      title={`Карта: ${address}`}
      loading="lazy"
    />
  );
}
