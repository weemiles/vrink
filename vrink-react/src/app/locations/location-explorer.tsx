"use client";

import Image from "next/image";
import Script from "next/script";
import { ChevronLeft, ChevronRight, MapPin, Minus, Plus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { withBasePath } from "@/lib/static-export";
import { vrinkLocations } from "./locations-data";
import styles from "./page.module.css";

type NaverLatLng = object;
type NaverPoint = object;
type NaverMap = {
  getZoom: () => number;
  panTo?: (center: NaverLatLng) => void;
  setCenter: (center: NaverLatLng) => void;
  setZoom: (zoom: number, effect?: boolean) => void;
};
type NaverInfoWindow = {
  close: () => void;
  open: (map: NaverMap, anchor?: NaverMarker | NaverLatLng) => void;
};
type NaverMarker = {
  setMap: (map: NaverMap | null) => void;
};

type NaverMapsApi = {
  Event: {
    addListener: (
      target: NaverMarker,
      eventName: "click" | "mouseover" | "mouseout",
      listener: () => void,
    ) => void;
  };
  LatLng: new (lat: number, lng: number) => NaverLatLng;
  InfoWindow: new (options: {
    anchorColor?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    content: string;
    maxWidth?: number;
    pixelOffset?: NaverPoint;
  }) => NaverInfoWindow;
  Map: new (
    element: HTMLElement,
    options: {
      center: NaverLatLng;
      minZoom?: number;
      maxZoom?: number;
      scrollWheel?: boolean;
      zoom: number;
      zoomControl?: boolean;
      zoomControlOptions?: {
        position: number;
      };
    },
  ) => NaverMap;
  Marker: new (options: {
    icon?: {
      anchor: NaverPoint;
      content: string;
    };
    map: NaverMap;
    position: NaverLatLng;
    title: string;
  }) => NaverMarker;
  Point: new (x: number, y: number) => NaverPoint;
  Position: {
    TOP_RIGHT: number;
  };
};

declare global {
  interface Window {
    naver?: {
      maps: NaverMapsApi;
    };
  }
}

const naverClientId =
  process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ??
  process.env.NEXT_PUBLIC_NAVER_MAP_NCP_KEY_ID ??
  "";
const markerLogoPath = "/images/vrink/brand/vrink-circle-logo.png";
type LocationExplorerProps = {
  locale?: "ko" | "en";
};

const locationExplorerCopy = {
  ko: {
    listLabel: "브링크 설치 지점 목록",
    listTitle: "지점 선택",
    fallbackMapLabel: "브링크 도입 지점 지도 미리보기",
    legendFailed: "네이버 지도 연결 실패",
    legendBeforeKey: "네이버 지도 키 연결 전 미리보기",
    naverMapLabel: "네이버 지도",
    mapLoading: "지도를 불러오는 중",
    zoomControlsLabel: "지도 확대 축소",
    zoomIn: "지도 확대",
    zoomOut: "지도 축소",
    popupCloseLabel: "지점 이미지 닫기",
    carouselControlsLabel: "현장 이미지 넘기기",
    prevImage: "이전 이미지",
    nextImage: "다음 이미지",
    carouselDotsLabel: "현장 이미지 선택",
    viewLocation: (name: string) => `${name} 위치 보기`,
    viewImage: (index: number) => `${index}번째 이미지 보기`,
  },
  en: {
    listLabel: "VRINK installation locations",
    listTitle: "Choose a location",
    fallbackMapLabel: "VRINK location map preview",
    legendFailed: "Couldn't connect to Naver Maps",
    legendBeforeKey: "Preview before the Naver Maps key is connected",
    naverMapLabel: "Naver Map",
    mapLoading: "Loading the map",
    zoomControlsLabel: "Zoom map in and out",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    popupCloseLabel: "Close location image",
    carouselControlsLabel: "Browse site images",
    prevImage: "Previous image",
    nextImage: "Next image",
    carouselDotsLabel: "Select site image",
    viewLocation: (name: string) => `View ${name} location`,
    viewImage: (index: number) => `View image ${index}`,
  },
} as const;

type LocationDisplay = {
  name: string;
  district: string;
  address: string;
};

const englishLocationDisplay: Record<string, LocationDisplay> = {
  "bysec-world-fitness": {
    name: "Bysec World Fitness",
    district: "Yeoksam-dong",
    address: "B1 Kyungnam Apt., 13 Eonju-ro 85-gil, Gangnam-gu, Seoul",
  },
  "ojim-wonju": {
    name: "O Gym",
    district: "Usan-dong",
    address: "3F, 69 Moran 1-gil, Wonju-si, Gangwon State",
  },
  "gym90-city-hall-station": {
    name: "Gym90 City Hall Station",
    district: "City Hall Station",
    address: "1F 102-103, 115 Seosomun-ro, Jung-gu, Seoul",
  },
  "gym90-city-hall": {
    name: "Gym90 City Hall",
    district: "City Hall",
    address: "2F 210, 64 Sejong-daero, Jung-gu, Seoul",
  },
  "west-gym-gangbyeon": {
    name: "West Gym Gangbyeon",
    district: "Gangbyeon",
    address: "B1, 86 Guuigangbyeon-ro, Gwangjin-gu, Seoul",
  },
  "west-gym-guui": {
    name: "West Gym Guui",
    district: "Guui",
    address: "B1 Segyeong Building, 86 Jayang-ro, Gwangjin-gu, Seoul",
  },
  "able-gym-sangam": {
    name: "Able Gym Sangam",
    district: "Sangam-dong",
    address: "B1 Woori Technology Building, 9 World Cup buk-ro 56-gil, Mapo-gu, Seoul",
  },
  "able-gym-balsan": {
    name: "Able Gym Balsan",
    district: "Naebalsan-dong",
    address: "B1, 348 Gangseo-ro, Gangseo-gu, Seoul",
  },
  "fore-wellness-gwacheon": {
    name: "Fore Wellness",
    district: "Galhyeon-dong",
    address: "3F Gwacheon Xi Elra Edition, 39 Gwacheon-daero 6ga-gil, Gwacheon-si, Gyeonggi-do",
  },
  "ss-fitness-gwanggyo": {
    name: "Double S Fitness Gwanggyo 1",
    district: "Gwanggyo",
    address: "B2, 277 Gwanggyo Hosugongwon-ro, Yeongtong-gu, Suwon-si, Gyeonggi-do",
  },
  "vrink-headquarters-hanam": {
    name: "VRINK Headquarters",
    district: "Gamil-dong",
    address: "1F-2F, 46 Dongnam-ro 406beon-gil, Hanam-si, Gyeonggi-do",
  },
  "dgym-yeongju": {
    name: "D Gym",
    district: "Gaheung-dong",
    address: "5 Daehak-ro 261beon-gil, Yeongju-si, Gyeongsangbuk-do",
  },
  "hawkeye-gym-wonju-2": {
    name: "Hawkeye Gym No. 2",
    district: "Bangok-dong",
    address: "36 Orihyeon-gil, Wonju-si, Gangwon State",
  },
  "gym90-ssangmun": {
    name: "Gym90 Ssangmun",
    district: "Ssangmun-dong",
    address: "5F, 218 Haedeung-ro, Dobong-gu, Seoul",
  },
  "gym90-hufs": {
    name: "Gym90 HUFS",
    district: "Hwigyeong-dong",
    address: "B1 The 305 Building, 13 Hwigyeong-ro, Dongdaemun-gu, Seoul",
  },
  "gym90-gwanghwamun": {
    name: "Gym90 Gwanghwamun",
    district: "Mugyo-dong",
    address: "9F-10F, 16 Mugyo-ro, Jung-gu, Seoul",
  },
  "gym90-gildong": {
    name: "Gym90 Gil-dong",
    district: "Gil-dong",
    address: "B1-B2, 1457 Yangjae-daero, Gangdong-gu, Seoul",
  },
  "star-gym-23-cheongdam": {
    name: "Star Gym 23",
    district: "Cheongdam-dong",
    address: "4F-5F Pungyang Building, 722 Yeongdong-daero, Gangnam-gu, Seoul",
  },
  "fitness-m-mapo": {
    name: "Fitness M Mapo",
    district: "Mapo",
    address: "B1 Hanwha Obelisk, 33 Mapo-daero, Mapo-gu, Seoul",
  },
  "mansumugang-health-andong": {
    name: "Mansumugang Health",
    district: "Yongsang-dong",
    address: "28 Gilju 1-gil, Andong-si, Gyeongsangbuk-do",
  },
  "gym-for-you-yullyang": {
    name: "Gym For You",
    district: "Yullyang-dong",
    address: "2F Seongil Building, 8-2 Yulbong-ro 176beon-gil, Cheongwon-gu, Cheongju-si",
  },
  "aone-gym-dongtan-station": {
    name: "A-One Gym Dongtan",
    district: "Dongtan Station",
    address: "6F 602, 124 Dongtanyeok-ro, Dongtan-gu, Hwaseong-si, Gyeonggi-do",
  },
};

function getLocationDisplay(
  location: (typeof vrinkLocations)[number],
  locale: LocationExplorerProps["locale"],
): LocationDisplay {
  if (locale === "en") {
    return englishLocationDisplay[location.id] ?? {
      name: location.name,
      district: location.district,
      address: location.address,
    };
  }

  return {
    name: location.name,
    district: location.district,
    address: location.address,
  };
}

const initialMapCenter = vrinkLocations.reduce(
  (center, location) => ({
    lat: center.lat + location.lat / vrinkLocations.length,
    lng: center.lng + location.lng / vrinkLocations.length,
  }),
  { lat: 0, lng: 0 },
);
const initialMapZoom = vrinkLocations.length > 6 ? 10 : vrinkLocations.length > 1 ? 12 : 16;

function createMarkerContent(
  name: string,
  locationId: string,
  isSelected: boolean,
  ariaLabel: string,
) {
  const markerLogoSrc = withBasePath(markerLogoPath);
  const markerColor = isSelected ? "#0071e3" : "#ffffff";
  const logoFilter = isSelected ? "brightness(0) invert(1)" : "none";

  return `
    <button
      type="button"
      aria-label="${ariaLabel}"
      onclick="window.dispatchEvent(new CustomEvent('vrink-location-open', { detail: '${locationId}' }))"
      style="
        align-items:center;
        background:transparent;
        border:0;
        cursor:pointer;
        display:inline-flex;
        height:42px;
        justify-content:center;
        padding:0;
        width:34px;
      "
    >
      <span style="
        display:block;
        filter:drop-shadow(0 12px 18px rgba(0,0,0,.26));
        height:42px;
        position:relative;
        width:34px;
      ">
        <svg
          aria-hidden="true"
          height="42"
          viewBox="0 0 34 42"
          width="34"
          style="display:block;left:0;position:absolute;top:0;"
        >
          <path
            d="M17 41C14.8 37.4 11.7 34.2 8.8 31.1C5.1 27.1 2 22.8 2 16.8C2 8.6 8.6 2 17 2C25.4 2 32 8.6 32 16.8C32 22.8 28.9 27.1 25.2 31.1C22.3 34.2 19.2 37.4 17 41Z"
            fill="${markerColor}"
            stroke="none"
          />
        </svg>
        <img
          alt=""
          src="${markerLogoSrc}"
          style="
            display:block;
            filter:${logoFilter};
            height:16px;
            left:9px;
            pointer-events:none;
            position:absolute;
            top:8px;
            width:16px;
          "
        />
      </span>
    </button>
  `;
}

function createHoverContent(name: string, address: string) {
  return `
    <article style="
      box-sizing:border-box;
      font-family:Pretendard, -apple-system, BlinkMacSystemFont, sans-serif;
      padding:15px 16px;
      width:260px;
    ">
      <strong style="
        color:#1d1d1f;
        display:block;
        font-size:14px;
        font-weight:650;
        line-height:20px;
        margin-bottom:7px;
      ">${name}</strong>
      <small style="
        color:rgba(0,0,0,.58);
        display:block;
        font-size:11px;
        line-height:16px;
      ">${address}</small>
    </article>
  `;
}

export function LocationExplorer({ locale = "ko" }: LocationExplorerProps) {
  const copy = locationExplorerCopy[locale];
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  const [popupLocationId, setPopupLocationId] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [allowMapScript, setAllowMapScript] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const naverMapRef = useRef<NaverMap | null>(null);
  const wheelZoomRef = useRef(0);
  const sortedLocations = useMemo(
    () =>
      [...vrinkLocations].sort((firstLocation, secondLocation) =>
        getLocationDisplay(firstLocation, locale).name.localeCompare(
          getLocationDisplay(secondLocation, locale).name,
          locale === "ko" ? "ko-KR" : "en-US",
          { sensitivity: "base" },
        ),
      ),
    [locale],
  );

  const hoveredLocation = hoveredLocationId
    ? vrinkLocations.find((location) => location.id === hoveredLocationId) ?? null
    : null;
  const popupLocation = popupLocationId
    ? vrinkLocations.find((location) => location.id === popupLocationId) ?? null
    : null;
  const popupImage = popupLocation ? popupLocation.images[activeImageIndex] : null;
  const popupDisplay = popupLocation ? getLocationDisplay(popupLocation, locale) : null;

  const showFallbackMap = !naverClientId || !allowMapScript || scriptFailed;

  const focusLocationOnMap = useCallback((locationId: string) => {
    const location = vrinkLocations.find((item) => item.id === locationId);
    const maps = window.naver?.maps;

    if (!location || !maps || !naverMapRef.current) {
      return;
    }

    const center = new maps.LatLng(location.lat, location.lng);
    if (naverMapRef.current.panTo) {
      naverMapRef.current.panTo(center);
      return;
    }

    naverMapRef.current.setCenter(center);
  }, []);

  const handleLocationOpen = useCallback(
    (locationId: string) => {
      setSelectedLocationId(locationId);
      setPopupLocationId(locationId);
      setActiveImageIndex(0);
      focusLocationOnMap(locationId);
    },
    [focusLocationOnMap],
  );

  const handlePopupClose = useCallback(() => {
    setPopupLocationId(null);
    setHoveredLocationId(null);

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  const handleMapZoom = useCallback((direction: -1 | 1) => {
    const map = naverMapRef.current;

    if (!map) {
      return;
    }

    const nextZoom = map.getZoom() + direction;
    map.setZoom(Math.min(19, Math.max(10, nextZoom)), true);
  }, []);

  useEffect(() => {
    const handleNaverScriptError = (event: ErrorEvent) => {
      const isNaverMapError =
        event.filename?.includes("oapi.map.naver.com") || event.message?.includes("KVO");

      if (!isNaverMapError) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      naverMapRef.current = null;
      setScriptReady(false);
      setScriptFailed(true);
    };

    const isLocalMapHost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

    window.addEventListener("error", handleNaverScriptError, true);
    queueMicrotask(() => setAllowMapScript(!isLocalMapHost));

    return () => window.removeEventListener("error", handleNaverScriptError, true);
  }, []);

  useEffect(() => {
    const handleMarkerOpen = (event: Event) => {
      const locationId = event instanceof CustomEvent ? event.detail : null;

      if (typeof locationId === "string") {
        handleLocationOpen(locationId);
      }
    };

    window.addEventListener("vrink-location-open", handleMarkerOpen);
    return () => window.removeEventListener("vrink-location-open", handleMarkerOpen);
  }, [handleLocationOpen]);

  function handleImageStep(direction: -1 | 1) {
    setActiveImageIndex((current) => {
      const imageCount = popupLocation?.images.length ?? 0;

      if (imageCount < 2) {
        return 0;
      }

      return (current + direction + imageCount) % imageCount;
    });
  }

  useEffect(() => {
    if (!popupLocation) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handlePopupClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handlePopupClose, popupLocation]);

  useEffect(() => {
    const maps = window.naver?.maps;

    if (!naverClientId || !scriptReady || !mapElementRef.current || !maps) {
      return;
    }

    try {
      if (!naverMapRef.current) {
        const center = new maps.LatLng(initialMapCenter.lat, initialMapCenter.lng);
        naverMapRef.current = new maps.Map(mapElementRef.current, {
          center,
          maxZoom: 19,
          minZoom: 10,
          scrollWheel: false,
          zoom: initialMapZoom,
          zoomControl: false,
          zoomControlOptions: {
            position: maps.Position.TOP_RIGHT,
          },
        });
      }

      const map = naverMapRef.current;
      const mapElement = mapElementRef.current;
      const handleWheel = (event: WheelEvent) => {
        event.preventDefault();

        const now = Date.now();
        if (now - wheelZoomRef.current < 280) {
          return;
        }

        wheelZoomRef.current = now;
        const currentZoom = map.getZoom();
        const nextZoom = currentZoom + (event.deltaY < 0 ? 1 : -1);
        map.setZoom(Math.min(19, Math.max(10, nextZoom)), true);
      };

      mapElement.addEventListener("wheel", handleWheel, { passive: false });

      const infoWindows: NaverInfoWindow[] = [];
      const markers = vrinkLocations.map((location) => {
        const display = getLocationDisplay(location, locale);
        const marker = new maps.Marker({
          icon: {
            anchor: new maps.Point(17, 42),
            content: createMarkerContent(
              display.name,
              location.id,
              selectedLocationId === location.id,
              copy.viewLocation(display.name),
            ),
          },
          map,
          position: new maps.LatLng(location.lat, location.lng),
          title: display.name,
        });

        const infoWindow = new maps.InfoWindow({
          anchorColor: "#ffffff",
          backgroundColor: "#ffffff",
          borderColor: "rgba(0,0,0,.08)",
          borderWidth: 1,
          content: createHoverContent(display.name, display.address),
          maxWidth: 270,
          pixelOffset: new maps.Point(0, -10),
        });

        infoWindows.push(infoWindow);

        maps.Event.addListener(marker, "mouseover", () => {
          setHoveredLocationId(location.id);
          infoWindow.open(map, marker);
        });

        maps.Event.addListener(marker, "mouseout", () => {
          setHoveredLocationId((current) => (current === location.id ? null : current));
          infoWindow.close();
        });

        maps.Event.addListener(marker, "click", () => {
          handleLocationOpen(location.id);
        });

        return marker;
      });

      return () => {
        mapElement.removeEventListener("wheel", handleWheel);
        infoWindows.forEach((infoWindow) => infoWindow.close());
        markers.forEach((marker) => marker.setMap(null));
      };
    } catch {
      naverMapRef.current = null;
      queueMicrotask(() => {
        setScriptReady(false);
        setScriptFailed(true);
      });
    }
  }, [copy, handleLocationOpen, locale, scriptReady, selectedLocationId]);

  return (
    <div className={styles.explorer} id="map">
      {naverClientId && allowMapScript && !scriptFailed ? (
        <Script
          id="naver-maps-sdk"
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${naverClientId}`}
          strategy="afterInteractive"
          onError={() => setScriptFailed(true)}
          onReady={() => setScriptReady(true)}
        />
      ) : null}

      <div className={styles.mapWorkspace}>
        <div className={styles.mapPanel}>
          {showFallbackMap ? (
            <div className={styles.fallbackMap} aria-label={copy.fallbackMapLabel}>
              {vrinkLocations.map((location) => {
                const display = getLocationDisplay(location, locale);

                return (
                  <button
                    className={`${styles.mapMarker} ${
                      selectedLocationId === location.id ? styles.mapMarkerActive : ""
                    }`}
                    key={location.id}
                    style={{
                      left: `${location.mapPosition.x}%`,
                      top: `${location.mapPosition.y}%`,
                    }}
                    type="button"
                    aria-label={copy.viewLocation(display.name)}
                    onBlur={() => setHoveredLocationId(null)}
                    onClick={() => handleLocationOpen(location.id)}
                    onFocus={() => setHoveredLocationId(location.id)}
                    onMouseEnter={() => setHoveredLocationId(location.id)}
                    onMouseLeave={() => setHoveredLocationId(null)}
                    onMouseMove={() => setHoveredLocationId(location.id)}
                    onPointerEnter={() => setHoveredLocationId(location.id)}
                    onPointerLeave={() => setHoveredLocationId(null)}
                    onPointerMove={() => setHoveredLocationId(location.id)}
                  >
                    <span className={styles.markerPin} aria-hidden="true">
                      <svg className={styles.markerPinShape} height="42" viewBox="0 0 34 42" width="34">
                        <path d="M17 41C14.8 37.4 11.7 34.2 8.8 31.1C5.1 27.1 2 22.8 2 16.8C2 8.6 8.6 2 17 2C25.4 2 32 8.6 32 16.8C32 22.8 28.9 27.1 25.2 31.1C22.3 34.2 19.2 37.4 17 41Z" />
                      </svg>
                      <Image
                        alt=""
                        className={styles.markerLogo}
                        height={16}
                        src={withBasePath(markerLogoPath)}
                        width={16}
                      />
                    </span>
                  </button>
                );
              })}
              {hoveredLocation ? (
                <article
                  className={styles.fallbackHoverCard}
                  style={{
                    left: `${hoveredLocation.mapPosition.x}%`,
                    top: `${hoveredLocation.mapPosition.y}%`,
                  }}
                >
                  <strong>{getLocationDisplay(hoveredLocation, locale).name}</strong>
                  <small>{getLocationDisplay(hoveredLocation, locale).address}</small>
                </article>
              ) : null}
              <div className={styles.mapLegend}>
                <MapPin aria-hidden="true" size={16} />
                <span>{naverClientId ? copy.legendFailed : copy.legendBeforeKey}</span>
              </div>
            </div>
          ) : (
            <div className={styles.naverMap} ref={mapElementRef} aria-label={copy.naverMapLabel} />
          )}

          {naverClientId && allowMapScript && !scriptReady && !scriptFailed ? (
            <p className={styles.mapLoading}>{copy.mapLoading}</p>
          ) : null}
          {scriptReady && !showFallbackMap ? (
            <div className={styles.mapZoomControls} aria-label={copy.zoomControlsLabel}>
              <button aria-label={copy.zoomIn} onClick={() => handleMapZoom(1)} type="button">
                <Plus aria-hidden="true" size={22} strokeWidth={2} />
              </button>
              <button aria-label={copy.zoomOut} onClick={() => handleMapZoom(-1)} type="button">
                <Minus aria-hidden="true" size={22} strokeWidth={2} />
              </button>
            </div>
          ) : null}
        </div>
        <aside className={styles.locationListPanel} aria-label={copy.listLabel}>
          <div className={styles.locationListHeader}>
            <span>{copy.listTitle}</span>
          </div>
          <div className={styles.locationList}>
            {sortedLocations.map((location) => {
              const display = getLocationDisplay(location, locale);

              return (
                <button
                  aria-current={selectedLocationId === location.id ? "true" : undefined}
                  key={location.id}
                  onClick={() => handleLocationOpen(location.id)}
                  onMouseEnter={() => setHoveredLocationId(location.id)}
                  onMouseLeave={() => setHoveredLocationId(null)}
                  type="button"
                >
                  <strong>{display.name}</strong>
                  <small>{display.address}</small>
                </button>
              );
            })}
          </div>
        </aside>
      </div>

      {popupLocation && typeof document !== "undefined"
        ? createPortal(
            <div
              className={styles.locationPopupBackdrop}
              onClick={handlePopupClose}
              role="presentation"
            >
              <section
                aria-labelledby="location-popup-title"
                aria-modal="true"
                className={`${styles.locationPopup} ${
                  popupImage ? "" : styles.locationPopupCompact
                }`}
                onClick={(event) => event.stopPropagation()}
                role="dialog"
              >
                <button
                  aria-label={copy.popupCloseLabel}
                  className={styles.locationPopupClose}
                  onClick={handlePopupClose}
                  type="button"
                >
                  <X aria-hidden="true" size={18} strokeWidth={1.8} />
                </button>
                {popupImage ? (
                  <div className={styles.locationPopupImage}>
                    <Image
                      src={withBasePath(popupImage.src)}
                      alt={
                        locale === "en" && popupDisplay
                          ? `${popupDisplay.name} installation image ${activeImageIndex + 1}`
                          : popupImage.alt
                      }
                      fill
                      priority
                      sizes="(max-width: 760px) 92vw, 560px"
                    />
                    {popupLocation.images.length > 1 ? (
                      <div className={styles.carouselControls} aria-label={copy.carouselControlsLabel}>
                        <button
                          aria-label={copy.prevImage}
                          onClick={() => handleImageStep(-1)}
                          type="button"
                        >
                          <ChevronLeft aria-hidden="true" size={19} strokeWidth={1.9} />
                        </button>
                        <button
                          aria-label={copy.nextImage}
                          onClick={() => handleImageStep(1)}
                          type="button"
                        >
                          <ChevronRight aria-hidden="true" size={19} strokeWidth={1.9} />
                        </button>
                      </div>
                    ) : null}
                    {popupLocation.images.length > 1 ? (
                      <div className={styles.carouselDots} aria-label={copy.carouselDotsLabel}>
                        {popupLocation.images.map((image, index) => (
                          <button
                            aria-label={copy.viewImage(index + 1)}
                            aria-pressed={activeImageIndex === index}
                            key={image.src}
                            onClick={() => setActiveImageIndex(index)}
                            type="button"
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {popupDisplay ? (
                  <div className={styles.locationPopupCopy}>
                    <h3 id="location-popup-title">{popupDisplay.name}</h3>
                    <p>{popupDisplay.address}</p>
                  </div>
                ) : null}
              </section>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
