import "mapbox-gl/dist/mapbox-gl.css";
import mgl from "mapbox-gl";
import * as Vue from "vue";

const is_2 = !(Vue.version || "").startsWith("3");

const defineComponent: typeof Vue.defineComponent = (options: any) => {
  if (is_2) {
    options.beforeDestroy = options.beforeUnmount;
    options.destroyed = options.unmounted;
    return (Vue as any).default.extend(options);
  }
  return Vue.defineComponent(options);
};
const get_h = (h?: any) => (typeof h === "function" ? h : Vue.h) as typeof Vue.h;
const get_children = (that: any) =>
  (typeof that.$slots.default === "function" ? that.$slots.default() : that.$slots.default) as [Vue.VNode];

const new_id = ((num) => () => `_` + (num++ + Math.random()).toString(36).replace(".", "_"))(0);
const replace_dom = (to_replace: Node, replace: Node) => {
  const parent = to_replace.parentNode!;
  parent.insertBefore(replace, to_replace);
  parent.removeChild(to_replace);
};

export const Map = defineComponent({
  name: "MglMap",
  props: {
    init: Object as () => Omit<mgl.MapboxOptions, "container">,
    cache: Object as () => mgl.Map,
  },
  data() {
    let map = this.cache!;
    if (!map) {
      const container = document.createElement("div");
      container.style.cssText = "position:absolute;top:0;right:0;bottom:0;left:0;";
      map = new mgl.Map({ ...this.init, container });
    }
    let is_style_loaded = map.isStyleLoaded();
    return { map, is_style_loaded };
  },
  render(h: typeof Vue.h) {
    h = get_h(h);
    return h("div", { style: "position:relative;overflow:hidden;width:100%;height:100%;" }, [this.is_style_loaded && get_children(this)]);
  },
  mounted() {
    const { map, is_style_loaded } = this;
    this.$el.appendChild(map.getContainer());
    map.resize();
    if (!is_style_loaded) {
      map.once("load", () => {
        this.is_style_loaded = true;
      });
    }
  },
  provide() {
    return { init_map: this.map };
  },
});
export const MglMap = Map;

export const Images = defineComponent({
  name: "MglImages",
  props: {
    init_imgs: {
      type: Object as () => Record<string, string>,
      required: true,
    },
  },
  inject: ["init_map"],
  data() {
    return { is_imgs_loaded: false, map: (this as any).init_map as mgl.Map, imgs: { ...this.init_imgs } };
  },
  render(h: typeof Vue.h) {
    h = get_h(h);
    return h("div", [this.is_imgs_loaded && get_children(this)]);
  },
  methods: {
    load_img(name: string, url: string) {
      const map = this.map;
      return new Promise((res, rej) => {
        map.loadImage(url, (err: Error, img: any) => {
          if (err) return rej(err);
          res(map.addImage(name, img));
        });
      });
    },
    unload_imgs() {
      const { map, imgs } = this;
      Object.keys(imgs).forEach((name) => map.hasImage(name) && map.removeImage(name));
    },
  },
  beforeMount() {
    const { map, imgs } = this;
    Promise.all(Object.keys(imgs).map((name) => this.load_img(name, imgs[name]))).then(
      (_) => (this.is_imgs_loaded = true),
      (err) => {
        this.unload_imgs();
        throw err;
      },
    );
  },
  unmounted() {
    this.unload_imgs();
  },
});
export const MglImages = Images;

export const Source = defineComponent({
  name: "MglSource",
  props: {
    source: {
      type: Object as () => mapboxgl.AnySourceData,
      required: true,
    },
  },
  inject: ["init_map"],
  data() {
    return { source_id: new_id(), map: (this as any).init_map as mgl.Map };
  },
  render(h: typeof Vue.h) {
    h = get_h(h);
    return h("div", [get_children(this)]);
  },
  provide() {
    return { init_source_id: this.source_id };
  },
  beforeMount() {
    this.map.addSource(this.source_id, this.source);
  },
  unmounted() {
    this.map.removeSource(this.source_id);
  },
  watch: {
    source(cv, pv) {
      const s = this.map.getSource(this.source_id);
      if (s.type === "geojson") {
        s.setData((cv as mapboxgl.GeoJSONSourceRaw).data!);
      }
      if (s.type === "canvas") {
        const _cv = cv as mapboxgl.CanvasSourceRaw;
        s.setCoordinates(_cv.coordinates);
        _cv.animate ? s.play() : s.pause();
      }
      if (s.type === "image") {
        s.updateImage(cv as mapboxgl.ImageSourceRaw);
      }
      if (s.type === "raster") {
        // do nothing
      }
      if (s.type === "raster-dem") {
        // do nothing
      }
      if (s.type === "vector") {
        // do nothing
      }
      if (s.type === "video") {
        s.setCoordinates((cv as mapboxgl.VideoSourceRaw).coordinates!);
      }
    },
  },
});
export const MglSource = Source;

export const GeojsonSource = defineComponent({
  name: "MglGeojsonSource",
  props: {
    init: Object as () => Omit<mapboxgl.GeoJSONSourceOptions, "data">,
    data: Object as () => mapboxgl.GeoJSONSourceOptions["data"],
  },
  data() {
    return { _init: { ...this.init } };
  },
  computed: {
    source() {
      const { _init, data } = this as any;
      return { ..._init, data, type: "geojson" };
    },
  },
  render(h: typeof Vue.h) {
    h = get_h(h);
    const props = { source: this.source };
    return h(Source as any, is_2 ? { props } : props, [get_children(this)]);
  },
});
export const MglGeojsonSource = GeojsonSource;

export const Layer = defineComponent({
  name: "MglLayer",
  props: {
    init_id: String,
    before_id: String,
    layer: {
      type: Object as () => Omit<mapboxgl.Layer, "id" | "source">,
      required: true,
    },
  },
  inject: ["init_map", "init_source_id"],
  data() {
    return {
      layer_id: this.init_id || new_id(),
      map: (this as any).init_map as mgl.Map,
      source_id: (this as any).init_source_id as string,
    };
  },
  render(h: typeof Vue.h) {
    return null;
  },
  provide() {
    return { init_layer_id: this.layer_id };
  },
  beforeMount() {
    this.map.addLayer({ ...(this.layer as any), id: this.layer_id, source: this.source_id });
    this.map.moveLayer(this.layer_id, this.before_id);
  },
  unmounted() {
    this.map.removeLayer(this.layer_id);
  },
  watch: {
    before_id(cv, pv) {
      this.map.moveLayer(this.layer_id, cv);
    },
    layer(cv, pv) {
      const { map, layer_id, source_id } = this;
      const { layout = {} as any, paint = {} as any, filter, minzoom, maxzoom, ...other } = cv || {};
      const l = map.getLayer(layer_id);
      Object.keys(layout).forEach((key) => map.setLayoutProperty(layer_id, key, layout[key]));
      Object.keys(paint).forEach((key) => map.setPaintProperty(layer_id, key, paint[key]));
      map.setFilter(layer_id, filter);
      map.setLayerZoomRange(layer_id, minzoom!, maxzoom!);
      Object.assign(l, { ...other, id: layer_id, source: source_id });
      map.triggerRepaint();
    },
  },
});
export const MglLayer = Layer;

export const Event = defineComponent({
  name: "MglEvent",
  props: {
    init_type: {
      type: String as () => keyof mapboxgl.MapLayerEventType,
      required: true,
    },
    init_layer: String,
    // @callback
  },
  inject: ["init_map", "init_layer_id"],
  data() {
    let callback = function (this: any, e: any) {
      this.$emit("callback", e);
    };
    callback = callback.bind(this);
    return {
      map: (this as any).init_map as mgl.Map,
      type: this.init_type,
      layer: this.init_layer || (this as any).init_layer_id,
      callback,
    };
  },
  render(h: typeof Vue.h) {
    return null;
  },
  beforeMount() {
    const { map, type, layer, callback } = this;
    if (layer) {
      map.on(type, layer, callback);
    } else {
      map.on(type, callback);
    }
  },
  unmounted() {
    const { map, type, layer, callback } = this;
    if (layer) {
      map.off(type, layer, callback);
    } else {
      map.off(type, callback);
    }
  },
});
export const MglEvent = Event;

// ! OriginMarker 对应真实 dom 的顺序 与 vdom 的顺序会不一致
export const OriginMarker = defineComponent({
  name: "MglOriginMarker",
  props: {
    lng_lat: {
      type: ([Object, Array] as any) as () => mapboxgl.LngLatLike,
      required: true,
    },
  },
  inject: ["init_map"],
  data() {
    const map = (this as any).init_map as mgl.Map;
    const div = document.createElement("div");
    const map_place: Node = document.createComment("");
    const vue_place: Node = document.createComment("");
    div.appendChild(map_place);
    const marker = new mgl.Marker(div);
    marker.setLngLat(this.lng_lat);
    marker.addTo(map);
    return { map, div, map_place, vue_place, marker, ele: null };
  },
  render(h: typeof Vue.h) {
    h = get_h(h);
    // 两层 div 是避免 $slots.default 是多元素 fragment
    return h("div", { class: "fasfaf" }, [h("div", [get_children(this)])]);
  },
  methods: {
    copy_css() {
      this.div.className = this.div.className
        .split(/\s/)
        .filter((it) => it.startsWith("mapboxgl-"))
        .concat(this.$el.className)
        .join(" ");
      this.div.style.cssText = this.div.style.cssText.match(/(transform\:\s.+\;)/)?.[1] + this.$el.style.cssText;
    },
    replace_in() {
      replace_dom(this.ele, this.vue_place);
      replace_dom(this.map_place, this.ele);
    },
    replace_out() {
      replace_dom(this.ele, this.map_place);
      replace_dom(this.vue_place, this.ele);
    },
  },
  mounted() {
    this.ele = this.$el.firstElementChild!;
    this.copy_css();
    this.replace_in();
  },
  beforeUpdate() {
    this.replace_out();
  },
  updated() {
    this.copy_css();
    this.replace_in();
  },
  beforeUnmount() {
    this.replace_out();
    this.marker.remove();
  },
  watch: {
    lng_lat(cv, pv) {
      this.marker.setLngLat(cv);
      this.marker.addTo(this.map);
    },
  },
});
export const MglOriginMarker = OriginMarker;

// ! OriginPopup 对应真实 dom 的顺序 与 vdom 的顺序会不一致
// ! 默认创建的 Popup 有 closeOnClick=true, 只要改变下 lng_lat 造成重新执行 addTo(map) 就能再次显示. 也可通过 key 重新创建来控制.
export const OriginPopup = defineComponent({
  name: "MglOriginPopup",
  props: {
    init: Object as () => mapboxgl.PopupOptions,
    lng_lat: {
      type: ([Object, Array] as any) as () => mapboxgl.LngLatLike,
      required: true,
    },
  },
  inject: ["init_map"],
  data() {
    const map = (this as any).init_map as mgl.Map;
    const div = document.createElement("div");
    const map_place: Node = document.createComment("");
    const vue_place: Node = document.createComment("");
    div.appendChild(map_place);
    const popup = new mgl.Popup(this.init);
    popup.setDOMContent(div);
    popup.setLngLat(this.lng_lat);
    popup.addTo(map);
    return { map, div, map_place, vue_place, popup, ele };
  },
  render(h: typeof Vue.h) {
    h = get_h(h);
    // 两层 div 是避免 $slots.default 是多元素 fragment
    return h("div", [h("div", [get_children(this)])]);
  },
  methods: {
    copy_css() {
      this.div.className = this.div.className
        .split(/\s/)
        .filter((it) => it.startsWith("mapboxgl-"))
        .concat(this.$el.className)
        .join(" ");
      this.div.style.cssText = this.div.style.cssText.match(/(transform\:\s.+\;)/)?.[1] + this.$el.style.cssText;
    },
    replace_in() {
      replace_dom(this.ele, this.vue_place);
      replace_dom(this.map_place, this.ele);
    },
    replace_out() {
      replace_dom(this.ele, this.map_place);
      replace_dom(this.vue_place, this.ele);
    },
  },
  mounted() {
    this.ele = this.$el.firstElementChild!;
    this.copy_css();
    this.replace_in();
  },
  beforeUpdate() {
    this.replace_out();
  },
  updated() {
    this.copy_css();
    this.replace_in();
  },
  beforeUnmount() {
    this.replace_out();
    this.popup.remove();
  },
  watch: {
    lng_lat(cv, pv) {
      this.popup.setLngLat(cv);
      this.popup.addTo(this.map);
    },
  },
});
export const MglOriginPopup = OriginPopup;

// export const Event1 = defineComponent({
//   name: "MglEvent",
//   props: {
//     type: {
//       type: String as () => keyof mapboxgl.MapLayerEventType,
//       required: true,
//     },
//     layer: String,
//   },
//   inject: ["init_map", "init_layer_id"],
//   data() {
//     let callback = function (this: any, e: any) {
//       this.$emit("dispatch", e);
//     };
//     callback = callback.bind(this);
//     return { map: (this as any).init_map as mgl.Map, callback };
//   },
//   computed: {
//     type_layer(): [string, string?] {
//       const type_layer = [this.type, this.layer] as const;
//       return type_layer as any;
//     },
//   },
//   methods: {
//     off_event([type, layer]: [any, string?]) {
//       if (layer) {
//         this.map.off(type, layer, this.callback);
//         return;
//       }
//       this.map.off(type, this.callback);
//     },
//   },
//   watch: {
//     type_layer: {
//       handler([type, layer], pv) {
//         if (pv) {
//           this.off_event(pv);
//         }
//         if (layer) {
//           this.map.on(type, layer, this.callback);
//           return;
//         }
//         this.map.on(type, this.callback);
//       },
//       immediate: true,
//     },
//   },
//   unmounted() {
//     this.off_event([this.type, this.layer]);
//   },
// });

// export const Event2 = defineComponent({
//   name: "MglEvent",
//   props: {
//     type: {
//       type: String as () => keyof mapboxgl.MapLayerEventType,
//       required: true,
//     },
//     layer: String,
//     callback: {
//       type: (null as any) as () => (e: (mapboxgl.MapLayerMouseEvent | mapboxgl.MapLayerTouchEvent) & Record<string, any>) => any,
//       required: true,
//     },
//   },
//   inject: ["init_map"],
//   data() {
//     return { map: (this as any).init_map as mgl.Map };
//   },
//   computed: {
//     params(): any {
//       return [this.type, this.layer, this.callback];
//     },
//   },
//   methods: {
//     off_event([type, layer, callback]: any) {
//       if (layer) {
//         this.map.off(type, layer, callback);
//         return;
//       }
//       this.map.off(type, callback);
//     },
//   },
//   watch: {
//     params: {
//       handler([type, layer, callback], pv) {
//         if (pv) {
//           this.off_event(pv);
//         }
//         if (layer) {
//           this.map.on(type, layer, callback);
//           return;
//         }
//         this.map.on(type, callback);
//       },
//       immediate: true,
//     },
//   },
//   unmounted() {
//     this.off_event(this.params);
//   },
// });
