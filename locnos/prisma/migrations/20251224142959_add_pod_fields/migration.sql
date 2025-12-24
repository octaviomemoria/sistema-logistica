-- AlterTable
ALTER TABLE "RouteStop" ADD COLUMN     "geoLat" DOUBLE PRECISION,
ADD COLUMN     "geoLng" DOUBLE PRECISION,
ADD COLUMN     "photos" TEXT[],
ADD COLUMN     "receiverName" TEXT,
ADD COLUMN     "signature" TEXT;
