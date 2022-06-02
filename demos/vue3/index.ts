import { createApp, h, defineComponent } from 'vue';
import { MglMap, MglOriginMarker, MglImages, MglGeojsonSource, MglLayer } from '../../index';

const map_init = {
  accessToken: `pk.eyJ1IjoiZG9sYnl6ZXJyIiwiYSI6InhIS25oN0EifQ.QQrwwFUZu6trJNjGsrpTFQ`,
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [116.396119, 39.925617] as const,
  zoom: 10,
};
const img = `https://avatars1.githubusercontent.com/u/4413712?s=60&v=4`;

let App = defineComponent({
  setup() {
    return () => h('div', { style: 'width:500px;height:500px' }, [h(MglMap as any, { init: map_init })]);
  },
});

App = defineComponent({
  setup() {
    return () =>
      h('div', { style: 'width:500px;height:500px' }, [
        h(MglMap as any, { init: map_init }, [h(MglOriginMarker, { lng_lat: [116.396119, 39.925617] }, [h('img', { src: img })])]),
      ]);
  },
});

App = defineComponent({
  data() {
    return { marker: true, images: true, geojson: true };
  },
  render() {
    return h('div', [
      h('button', { onclick: () => (this.marker = !this.marker) }, 'marker' + this.marker),
      h('button', { onclick: () => (this.images = !this.images) }, 'images' + this.images),
      h('button', { onclick: () => (this.geojson = !this.geojson) }, 'geojson' + this.geojson),
      h('div', { style: 'width:500px;height:500px' }, [
        h(MglMap as any, { init: map_init }, [
          this.marker && h(MglOriginMarker as any, { lng_lat: [116.396119, 39.925617] }, [h('img', { src: img })]),
          this.images &&
            h(MglImages as any, { init_imgs: { xxx: img } }, [
              this.geojson &&
                h(
                  MglGeojsonSource,
                  {
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
                  [
                    h(MglLayer as any, {
                      layer: {
                        type: 'symbol',
                        layout: {
                          'icon-image': 'xxx',
                          'icon-allow-overlap': true,
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

createApp(App).mount('#app');
