import { h, defineComponent, getCurrentInstance, isVue2, PropType } from 'vue-demi';
import { shallowRef, computed, watch, provide, inject } from 'vue-demi';
import { onMounted, onBeforeUpdate, onUpdated, onBeforeUnmount, onUnmounted } from 'vue-demi';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';

const SYMBOL_MAP = Symbol('SYMBOL_MAP');
const SYMBOL_SOURCE_ID = Symbol('SYMBOL_SOURCE_ID');
const SYMBOL_LAYER_ID = Symbol('SYMBOL_LAYER_ID');

const new_id = (num => () => {
  return `_` + (num++ + Math.random()).toString(36).replace('.', '_');
})(0);
const ensure_ctx_expose = (ctx: any) => {
  if (ctx.expose) return;
  ctx.expose = (exposing: any) => Object.assign(getCurrentInstance()!.proxy!, exposing);
};
// const replace_dom = (to_replace: Node, replace: Node) => {
//   const parent = to_replace.parentNode!;
//   parent.insertBefore(replace, to_replace);
//   parent.removeChild(to_replace);
// };

export const MglMap = defineComponent({
  name: 'MglMap',
  props: {
    init: Object as PropType<Omit<mapboxgl.MapboxOptions, 'container'>>,
    cache: Object as PropType<mapboxgl.Map>,
  },
  setup(props, ctx) {
    const insp = getCurrentInstance()!.proxy!;
    const { init, cache } = props;
    let map = cache!;
    if (!map) {
      const container = document.createElement('div');
      container.style.cssText = 'position:absolute;top:0;right:0;bottom:0;left:0;';
      map = new mapboxgl.Map({ ...init, container });
    }
    ensure_ctx_expose(ctx);
    ctx.expose({ map });
    provide(SYMBOL_MAP, map);
    const is_map_loaded = shallowRef(false);
    onMounted(() => {
      insp.$el.appendChild(map.getContainer());
      map.resize();
      // insp.$nextTick().then(() => map.resize());
      is_map_loaded.value = map.isStyleLoaded();
      if (!is_map_loaded.value) {
        map.once('load', () => (is_map_loaded.value = true));
      }
    });
    const wrapper_style = {
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
    } as const;
    return () => {
      return h('div', { style: wrapper_style }, [is_map_loaded.value && ctx.slots.default?.()]);
    };
  },
});

export const MglEvent = defineComponent({
  name: 'MglEvent',
  props: {
    init_type: {
      type: String as PropType<keyof mapboxgl.MapLayerEventType>,
      required: true,
    },
    init_layer_id: String,
  },
  emits: ['callback'],
  setup(props, ctx) {
    const map = inject<mapboxgl.Map>(SYMBOL_MAP)!;
    const layer_id = props.init_layer_id || inject<string>(SYMBOL_LAYER_ID);
    if (layer_id) {
      map.on(props.init_type, layer_id, e => ctx.emit('callback', e));
    } else {
      map.on(props.init_type, e => ctx.emit('callback', e));
    }
    return () => h('div', [ctx.slots.default?.()]);
  },
});

export const MglImages = defineComponent({
  name: 'MglImages',
  props: {
    init_imgs: {
      type: Object as PropType<Record<string, string>>,
      required: true,
    },
  },
  setup(props, ctx) {
    const { init_imgs } = props;
    const map = inject<mapboxgl.Map>(SYMBOL_MAP)!;

    const load_img = (name: string, url: string) => {
      return new Promise<HTMLImageElement | ImageBitmap | undefined>((res, rej) => {
        map.loadImage(url, (err, img) => {
          if (err) return rej(err);
          map.addImage(name, img!);
          res(img);
        });
      });
    };
    const unload_imgs = () => {
      Object.keys(init_imgs).forEach(name => map.hasImage(name) && map.removeImage(name));
    };

    const is_imgs_loaded = shallowRef(false);
    Promise.all(Object.keys(init_imgs).map(name => load_img(name, init_imgs[name]))).then(
      _ => (is_imgs_loaded.value = true),
      err => {
        unload_imgs();
        throw err;
      }
    );
    onUnmounted(() => unload_imgs());

    return () => h('div', [is_imgs_loaded.value && ctx.slots.default?.()]);
  },
});

export const MglSource = defineComponent({
  name: 'MglSource',
  props: {
    init_id: String,
    source: {
      type: Object as PropType<mapboxgl.AnySourceData>,
      required: true,
    },
  },
  setup(props, ctx) {
    const map = inject<mapboxgl.Map>(SYMBOL_MAP)!;
    const source_id = props.init_id || new_id();
    provide(SYMBOL_SOURCE_ID, source_id);
    map.addSource(source_id, props.source);
    onUnmounted(() => map.removeSource(source_id));
    watch(
      () => props.source,
      cv => {
        const s = map.getSource(source_id);
        if (s.type === 'geojson') {
          s.setData((cv as mapboxgl.GeoJSONSourceRaw).data!);
        }
        if (s.type === 'canvas') {
          const _cv = cv as mapboxgl.CanvasSourceRaw;
          s.setCoordinates(_cv.coordinates);
          _cv.animate ? s.play() : s.pause();
        }
        if (s.type === 'image') {
          s.updateImage(cv as mapboxgl.ImageSourceRaw);
        }
        if (s.type === 'raster') {
          // do nothing
        }
        if (s.type === 'raster-dem') {
          // do nothing
        }
        if (s.type === 'vector') {
          // do nothing
        }
        if (s.type === 'video') {
          s.setCoordinates((cv as mapboxgl.VideoSourceRaw).coordinates!);
        }
      }
    );
    return () => h('div', [ctx.slots.default?.()]);
  },
});

export const MglGeojsonSource = defineComponent({
  name: 'MglGeojsonSource',
  props: {
    init_id: String,
    init: Object as PropType<Omit<mapboxgl.GeoJSONSourceOptions, 'data'>>,
    data: Object as PropType<mapboxgl.GeoJSONSourceOptions['data']>,
  },
  setup(props, ctx) {
    const source = computed(() => {
      return { ...props.init, data: props.data, type: 'geojson' };
    });
    return () => {
      const _props = { init_id: props.init_id, source: source.value };
      return h('div', [h(MglSource as any, isVue2 ? { props: _props } : _props, [ctx.slots.default?.()])]);
    };
  },
});

export const MglCanvasSource = defineComponent({
  name: 'MglCanvasSource',
  props: {
    init_id: String,
    init_canvas: [String, Object] as PropType<mapboxgl.CanvasSourceOptions['canvas']>,
    coordinates: Array as PropType<mapboxgl.CanvasSourceOptions['coordinates']>,
    animate: Boolean,
  },
  setup(props, ctx) {
    const insp = getCurrentInstance()!.proxy!;
    const { init_canvas } = props;
    const should_create_canvas = !init_canvas;
    const canvas_ref = shallowRef(init_canvas);
    onMounted(() => {
      if (should_create_canvas) {
        canvas_ref.value = insp.$refs.canvas as HTMLCanvasElement;
      }
    });
    const source = computed(() => {
      return {
        canvas: canvas_ref.value,
        coordinates: props.coordinates,
        animate: props.animate,
      };
    });
    return () => {
      const _props = { init_id: props.init_id, source: source.value };
      return h('div', [
        should_create_canvas && h('canvas', { ref: 'canvas', attrs: ctx.attrs }),
        canvas_ref.value && h(MglSource as any, isVue2 ? { props: _props } : _props, [ctx.slots.default?.()]),
      ]);
    };
  },
});

export const MglLayer = defineComponent({
  name: 'MglLayer',
  props: {
    init_id: String,
    before_id: String,
    layer: {
      type: Object as () => Omit<mapboxgl.Layer, 'id' | 'source'>,
      required: true,
    },
  },
  setup(props, ctx) {
    const map = inject<mapboxgl.Map>(SYMBOL_MAP)!;
    const source_id = inject<string>(SYMBOL_SOURCE_ID);
    const layer_id = props.init_id || new_id();
    provide(SYMBOL_LAYER_ID, layer_id);

    map.addLayer({ ...(props.layer as any), id: layer_id, source: source_id });
    onUnmounted(() => map.removeLayer(layer_id));
    // // 不是 用 watch.immediate.true 来立即设置 before_id, 而是在 onMounted 里去设置是避免 before_id 不存在
    // onMounted(() => map.moveLayer(layer_id, props.before_id));
    watch(
      () => props.before_id,
      cv => map.moveLayer(layer_id, cv),
      { immediate: true }
    );
    watch(
      () => props.layer,
      (cv, pv, inv) => {
        const { layout = {} as any, paint = {} as any, filter, minzoom, maxzoom, ...other } = cv || {};
        const l = map.getLayer(layer_id);
        Object.keys(layout).forEach(key => map.setLayoutProperty(layer_id, key, layout[key]));
        Object.keys(paint).forEach(key => map.setPaintProperty(layer_id, key, paint[key]));
        map.setFilter(layer_id, filter);
        map.setLayerZoomRange(layer_id, minzoom!, maxzoom!);
        Object.assign(l, { ...other, id: layer_id, source: source_id });
        map.triggerRepaint();
      }
    );
    return () => h('div', [ctx.slots.default?.()]);
  },
});

export const MglOriginMarker = defineComponent({
  name: 'MglOriginMarker',
  props: {
    lng_lat: {
      type: [Object, Array] as PropType<mapboxgl.LngLatLike>,
      required: true,
    },
  },
  setup(props, ctx) {
    const insp = getCurrentInstance()!.proxy!;
    const map = inject<mapboxgl.Map>(SYMBOL_MAP)!;
    const div = document.createElement('div');
    const marker = new mapboxgl.Marker(div);
    ensure_ctx_expose(ctx);
    ctx.expose({ marker });
    watch(
      () => props.lng_lat,
      cv => {
        marker.setLngLat(cv);
        marker.addTo(map);
      },
      { immediate: true }
    );
    onMounted(() => {
      const content_div = insp.$el.firstElementChild;
      div.appendChild(content_div);
      onBeforeUnmount(() => {
        insp.$el.appendChild(content_div);
        marker.remove();
      });
      // TODO: 其实应该是有 onBeforeUpdate 时把 dom 移回来, onUpdated 时再移回去的逻辑, 但是这样性能并不是很好, 而且 css 动画都会重新播放, 体验不是很好.
      // 基于 vue vdom 都有对应的真实 dom 的引用, 本身并没有严格检查真实 dom 的结构, 下面又把 slot 包装进一个 div 里去了, 所以也不会有问题. Popup 同样如此
    });

    return () => h('div', [h('div', [ctx.slots.default?.()])]);
  },
});

// export const MglOriginMarker = defineComponent({
//   name: 'MglOriginMarker',
//   props: {
//     init_sync: Boolean,
//     lng_lat: {
//       type: [Object, Array] as PropType<mapboxgl.LngLatLike>,
//       required: true,
//     },
//   },
//   setup(props, ctx) {
//     const insp = getCurrentInstance()!.proxy!;
//     const map = inject<mapboxgl.Map>(SYMBOL_MAP)!;
//     const init_sync = props.init_sync;
//     onMounted(() => {
//       const div = document.createElement('div');
//       // ! 此种方式原本有问题就是 dom 的顺序与 jsx/template 无关, 而是与创建时间顺序有关, 导致想要 hover 的元素想要 z 轴覆盖其他元素必须让它更晚创建.
//       // ! 至于 z-index 也是不行的, 因为 mapboxgl 给 marker div 增加了样式, 让内部元素的 z-index 无法透出
//       // ! 这导致我们只能通过这种方式去修改 onMounted 里创建的 div
//       // 其实主要问题是 ins.$el.parentElement 竟然一开始不存在
//       const copy_css = () => {
//         // mapbox-gl 自己会给元素增加 mapboxgl- 开头的 className 和 style.transform, 不得动它们
//         div.className = div.className
//           .split(/\s/)
//           .filter(it => it.startsWith('mapboxgl-'))
//           .concat(insp.$el.className)
//           .join(' ');
//         // div.className = ins.$el.className;
//         // div.setAttribute('style', ins.$el.getAttribute('style')!);
//         div.style.cssText = div.style.cssText.match(/(transform\:\s.+\;)/)?.[1] + (ins.$el as HTMLDivElement).style.cssText;
//       };
//       copy_css();
//       onUpdated(copy_css);
//       const marker = new mapboxgl.Marker(div);
//       onUnmounted(() => marker.remove());
//       watch(
//         () => props.lng_lat,
//         cv => {
//           marker.setLngLat(cv);
//           marker.addTo(map);
//         },
//         { immediate: true }
//       );

//       const map_place: Node = document.createComment('');
//       div.appendChild(map_place);
//       const vue_place: Node = document.createComment('');
//       const ele = ins.$el.firstElementChild!;
//       const replace_in = () => {
//         replace_dom(ele, vue_place);
//         replace_dom(map_place, ele);
//       };
//       const replace_out = () => {
//         replace_dom(ele, map_place);
//         replace_dom(vue_place, ele);
//       };
//       replace_in();
//       onBeforeUpdate(replace_out);
//       onUpdated(replace_in);
//       onBeforeUnmount(replace_out);
//     });
//     return () => h('div', [h('div', [ctx.slots.default?.()])]);
//   },
// });

export const MglOriginPopup = defineComponent({
  name: 'MglOriginPopup',
  props: {
    init: Object as () => mapboxgl.PopupOptions,
    lng_lat: [Object, Array] as any as () => mapboxgl.LngLatLike,
  },
  setup(props, ctx) {
    const insp = getCurrentInstance()!.proxy!;
    const map = inject<mapboxgl.Map>(SYMBOL_MAP)!;
    const div = document.createElement('div');
    const popup = new mapboxgl.Popup(props.init);
    ensure_ctx_expose(ctx);
    ctx.expose({ popup });
    popup.setDOMContent(div);
    watch(
      () => props.lng_lat,
      cv => {
        cv ? popup.setLngLat(cv) : popup.trackPointer();
        popup.addTo(map);
      },
      { immediate: true }
    );
    onMounted(() => {
      const content_div = insp.$el.firstElementChild;
      div.appendChild(content_div);
      onBeforeUnmount(() => {
        insp.$el.appendChild(content_div);
        popup.remove();
      });
    });
    return () => h('div', [h('div', [ctx.slots.default?.()])]);
  },
});

// // ! 目前默认是创建 mapboxgl.Popup 时是 closeOnClick=true, 那就会出现 mapboxgl.Popup 已经关闭了, 但当前这个 Popup vue 组件还存在的情况.
// // ! 此时移动下 lng_lat 就能让 Popup 重新出现, 部分受控.
// // ! 如果担心需要 Popup 出现, 但 lng_lat 并不变化(其实不可能, 因为它是 object/array), 可对 vue 组件加 key.
// export const Popup = defineComponent({
//   name: 'MglPopup',
//   props: {
//     init: Object as () => mapboxgl.PopupOptions,
//     lng_lat: {
//       type: [Object, Array] as any as () => mapboxgl.LngLatLike,
//       required: true,
//     },
//   },
//   setup(props, ctx) {
//     const ins = getCurrentInstance()!;
//     const map = inject<mapboxgl.Map>(SYMBOL_MAP)!;
//     onMounted(() => {
//       const div = document.createElement('div');
//       const popup = new mapboxgl.Popup(props.init);
//       popup.setDOMContent(div);
//       onUnmounted(() => popup.remove());
//       watch(
//         () => props.lng_lat,
//         cv => {
//           popup.setLngLat(cv);
//           // * 随时都把 popup 重新加到 map 上, 避免用户因 closeOnClick=true 而关闭了 popup 之后就不能再打开它 的困境
//           // * 那种困境下只能重新创建 vue 组件, 很麻烦...本质上其实是很多使用方式并不完全需要 事件 来进行完全的受控组件开发
//           popup.addTo(map);
//         },
//         { immediate: true }
//       );

//       const map_place: Node = document.createComment('');
//       div.appendChild(map_place);
//       const vue_place: Node = document.createComment('');
//       const ele = ins.$el.firstElementChild!;
//       const replace_in = () => {
//         replace_dom(ele, vue_place);
//         replace_dom(map_place, ele);
//       };
//       const replace_out = () => {
//         replace_dom(ele, map_place);
//         replace_dom(vue_place, ele);
//       };
//       replace_in();
//       onBeforeUpdate(replace_out);
//       onUpdated(replace_in);
//       onBeforeUnmount(replace_out);
//     });
//     return () => h('div', [h('div', [ctx.slots.default?.()])]);
//   },
// });
