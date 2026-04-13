FROM golang:1.25-alpine AS build

WORKDIR /src
COPY go.mod ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -o /out/themepark-api .

FROM alpine:3.19

WORKDIR /app
COPY --from=build /out/themepark-api ./themepark-api
EXPOSE 8080
ENV PORT=8080
CMD ["./themepark-api"]
