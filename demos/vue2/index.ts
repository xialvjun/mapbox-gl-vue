import Vue from 'vue2';
import { MglMap, MglOriginMarker, MglImages, MglGeojsonSource, MglLayer } from '../../index';

const map_init = {
  accessToken: `pk.eyJ1IjoiZG9sYnl6ZXJyIiwiYSI6InhIS25oN0EifQ.QQrwwFUZu6trJNjGsrpTFQ`,
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [116.396119, 39.925617] as const,
  zoom: 10,
};
const img = `https://avatars1.githubusercontent.com/u/4413712?s=60&v=4`;

let App = Vue.extend({
  render(h) {
    return h('div', { style: 'width:500px;height:500px' }, [h(MglMap, { props: { init: map_init } })]);
  },
});

App = Vue.extend({
  render(h) {
    return h('div', { style: 'width:500px;height:500px' }, [
      h(MglMap, { props: { init: map_init } }, [
        h(MglOriginMarker, { props: { lng_lat: [116.396119, 39.925617] } }, [h('img', { domProps: { src: img } })]),
      ]),
    ]);
  },
});

App = Vue.extend({
  data() {
    return { marker: true, images: true, geojson: true };
  },
  render(h) {
    return h('div', [
      h('button', { on: { click: () => (this.marker = !this.marker) } }, 'marker' + this.marker),
      h('button', { on: { click: () => (this.images = !this.images) } }, 'images' + this.images),
      h('button', { on: { click: () => (this.geojson = !this.geojson) } }, 'geojson' + this.geojson),
      h('div', { style: 'width:500px;height:500px' }, [
        h(MglMap, { props: { init: map_init } }, [
          this.marker && h(MglOriginMarker, { props: { lng_lat: [116.396119, 39.925617] } }, [h('img', { domProps: { src: img } })]),
          this.images &&
            h(MglImages, { props: { init_imgs: { xxx: img } } }, [
              this.geojson &&
                h(
                  MglGeojsonSource,
                  {
                    props: {
                      data: {
                        type: 'Feature',
                        properties: {
                          icon: 'theatre',
                        },
                        geometry: {
                          type: 'Point',
                          coordinates: [116.396119, 39.925617],
                        },
                      },
                    },
                  },
                  [
                    h(MglLayer, {
                      props: {
                        layer: {
                          type: 'symbol',
                          layout: {
                            'icon-image': 'xxx',
                            'icon-allow-overlap': true,
                          },
                        },
                      },
                    }),
                  ]
                ),
            ]),
        ]),
      ]),
    ]);
  },
});

new App().$mount('#app');
