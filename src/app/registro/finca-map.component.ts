import { Component, effect, ElementRef, input, OnDestroy, output, viewChild } from '@angular/core';
import { divIcon, map, marker, tileLayer } from 'leaflet';
import type { LatLng, Map, Marker } from 'leaflet';

export interface FarmPoint {
  latitud: number;
  longitud: number;
  precision?: number;
}

@Component({
  selector: 'app-finca-map',
  template: '<div #container class="farm-map" role="region" aria-label="Mapa de la ubicación de la finca"></div>',
  styles: ['.farm-map { width: 100%; height: 200px; border-radius: 12px; overflow: hidden; isolation: isolate; }'],
})
export class FincaMapComponent implements OnDestroy {
  readonly point = input.required<FarmPoint>();
  readonly moved = output<FarmPoint>();
  private readonly container = viewChild<ElementRef<HTMLDivElement>>('container');
  private map?: Map;
  private marker?: Marker;
  private resizeObserver?: ResizeObserver;

  constructor() {
    effect(() => {
      const container = this.container();
      if (!container) return;
      const { latitud, longitud, precision } = this.point();
      const coordinates: [number, number] = [latitud, longitud];
      const zoom = precision === undefined ? 13 : precision > 1000 ? 12 : 16;
      if (!this.map) {
        this.map = map(container.nativeElement, { scrollWheelZoom: false, maxZoom: 19, zoomAnimation: false })
          .setView(coordinates, zoom);
        this.resizeObserver = new ResizeObserver(() => {
          this.map?.invalidateSize({ pan: false });
        });
        this.resizeObserver.observe(container.nativeElement);
        tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(this.map);
        this.marker = marker(coordinates, {
          draggable: true,
          title: 'Punto de la finca',
          icon: divIcon({
            className: 'farm-map-pin',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          }),
        }).addTo(this.map);
        this.marker.on('dragend', () => {
          if (this.marker) this.selectPoint(this.marker.getLatLng());
        });
        this.map.on('click', (event) => this.selectPoint(event.latlng));
      } else if (!this.marker?.getLatLng().equals(coordinates, 0)) {
        this.marker?.setLatLng(coordinates);
        this.map.setView(coordinates, zoom);
      }
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }

  private selectPoint(point: LatLng): void {
    const wrapped = point.wrap();
    this.marker?.setLatLng(wrapped);
    this.moved.emit({ latitud: wrapped.lat, longitud: wrapped.lng });
  }
}
