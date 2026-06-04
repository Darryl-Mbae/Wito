export const EVENT_IMAGES = [
    "/images/events/event-1.jpg",
    "/images/events/event-2.jpg",
    "/images/events/event-3.jpg",
    "/images/events/event-4.jpg",
    "/images/events/event-5.jpg",
    "/images/events/event-6.jpg",
    "/images/events/event-7.jpg",
    "/images/events/event-8.jpg",
    "/images/events/event-9.jpg",
    "/images/events/event-10.jpg",
];

export const randomEventImage = () =>
    EVENT_IMAGES[Math.floor(Math.random() * EVENT_IMAGES.length)];