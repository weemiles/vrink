export type VrinkLocation = {
  id: string;
  name: string;
  city: string;
  district: string;
  address: string;
  images: {
    src: string;
    alt: string;
  }[];
  lat: number;
  lng: number;
  mapPosition: {
    x: number;
    y: number;
  };
};

export const vrinkLocations: VrinkLocation[] = [
  {
    id: "buildup-fitness-seongsu",
    name: "빌드업피트니스 PT 성수역점",
    city: "서울",
    district: "성수역점",
    address: "서울 성동구 아차산로 97 남영빌딩 3층",
    images: [
      {
        src: "/images/vrink/locations/build-up-fitness-seongsu.jpg",
        alt: "빌드업피트니스 성수역점에 설치된 브링크 제로스테이션 전경",
      },
      {
        src: "/images/vrink/locations/build-up-fitness-seongsu-wide.jpg",
        alt: "빌드업피트니스 성수역점 브링크 설치 공간 와이드 이미지",
      },
      {
        src: "/images/vrink/locations/build-up-fitness-seongsu-station.jpg",
        alt: "빌드업피트니스 성수역점 리셉션 옆 브링크 설치 이미지",
      },
    ],
    lat: 37.5459,
    lng: 127.0547,
    mapPosition: { x: 51, y: 42 },
  },
  {
    id: "bysec-world-fitness",
    name: "바이젝월드피트니스",
    city: "서울",
    district: "역삼동",
    address: "서울 강남구 언주로85길 13 경남아파트 지하1층",
    images: [],
    lat: 37.500740753806,
    lng: 127.0420971394,
    mapPosition: { x: 48, y: 68 },
  },
];
