"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";

interface GalleryItem {
    id: string;
    title: string;
    summary: string;
    url: string;
    image: string;
}

interface Gallery6Props {
    heading?: string;
    demoUrl?: string;
    items?: GalleryItem[];
}

const Gallery6 = ({
    heading = "Gallery",
    demoUrl = "#",
    items = [],
}: Gallery6Props) => {
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);
    useEffect(() => {
        if (!carouselApi) {
            return;
        }
        const updateSelection = () => {
            setCanScrollPrev(carouselApi.canScrollPrev());
            setCanScrollNext(carouselApi.canScrollNext());
        };
        updateSelection();
        carouselApi.on("select", updateSelection);
        return () => {
            carouselApi.off("select", updateSelection);
        };
    }, [carouselApi]);
    return (
        <section className="py-24 sm:py-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col justify-between md:mb-14 md:flex-row md:items-end lg:mb-16">
                    <div>
                        <h2 className="mb-3 text-3xl font-semibold md:mb-4 md:text-4xl lg:mb-6">
                            {heading}
                        </h2>
                        <a
                            href={demoUrl}
                            className="group flex items-center gap-1 text-sm font-medium md:text-base lg:text-lg hover:underline transition-all"
                        >
                            도입 문의하기
                            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-1" />
                        </a>
                    </div>
                    <div className="mt-8 flex shrink-0 items-center justify-start gap-2">
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                                carouselApi?.scrollPrev();
                            }}
                            disabled={!canScrollPrev}
                            className="disabled:pointer-events-auto"
                        >
                            <ArrowLeft className="size-5" />
                        </Button>
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                                carouselApi?.scrollNext();
                            }}
                            disabled={!canScrollNext}
                            className="disabled:pointer-events-auto"
                        >
                            <ArrowRight className="size-5" />
                        </Button>
                    </div>
                </div>
            </div>
            <div className="w-full">
                <Carousel
                    setApi={setCarouselApi}
                    opts={{
                        breakpoints: {
                            "(max-width: 768px)": {
                                dragFree: true,
                            },
                        },
                    }}
                    className="relative max-w-7xl mx-auto"
                >
                    <CarouselContent className="px-4">
                        {items.map((item) => (
                            <CarouselItem key={item.id} className="pl-4 md:max-w-[452px]">
                                <Card className="h-full group flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                                    <a
                                        href={item.url}
                                        className="flex flex-col h-full"
                                    >
                                        <div className="flex aspect-[3/2] overflow-clip">
                                            <div className="relative h-full w-full origin-bottom transition duration-500 group-hover:scale-105">
                                                <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="h-full w-full object-cover object-center"
                                                />
                                            </div>
                                        </div>
                                        <CardHeader className="pt-6">
                                            <CardTitle className="line-clamp-2 break-words text-xl font-bold md:text-2xl">
                                                {item.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-grow">
                                            <p className="line-clamp-3 text-sm text-foreground/80 md:text-base">
                                                {item.summary}
                                            </p>
                                        </CardContent>
                                        <CardFooter>
                                            <div className="flex items-center text-sm font-medium text-primary">
                                                자세히 보기{" "}
                                                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                                            </div>
                                        </CardFooter>
                                    </a>
                                </Card>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>
    );
};

export { Gallery6 };
