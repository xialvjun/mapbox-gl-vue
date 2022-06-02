var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { h, defineComponent, getCurrentInstance, isVue2 } from 'vue-demi';
import { shallowRef, computed, watch, provide, inject } from 'vue-demi';
import { onMounted, onBeforeUnmount, onUnmounted } from 'vue-demi';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
var SYMBOL_MAP = Symbol('SYMBOL_MAP');
var SYMBOL_SOURCE_ID = Symbol('SYMBOL_SOURCE_ID');
var SYMBOL_LAYER_ID = Symbol('SYMBOL_LAYER_ID');
var new_id = (function (num) { return function () {
    return "_" + (num++ + Math.random()).toString(36).replace('.', '_');
}; })(0);
var ensure_ctx_expose = function (ctx) {
    if (ctx.expose)
        return;
    ctx.expose = function (exposing) {
        var instance = getCurrentInstance();
        if (!instance) {
            throw new Error('expose should be called in setup().');
        }
        var keys = Object.keys(exposing);
        keys.forEach(function (key) {
            instance.proxy[key] = exposing[key];
        });
        onBeforeUnmount(function () {
            keys.forEach(function (key) {
                instance.proxy[key] = undefined;
            });
        });
    };
};
// const replace_dom = (to_replace: Node, replace: Node) => {
//   const parent = to_replace.parentNode!;
//   parent.insertBefore(replace, to_replace);
//   parent.removeChild(to_replace);
// };
export var MglMap = defineComponent({
    name: 'MglMap',
    props: {
        init: Object,
        cache: Object,
    },
    setup: function (props, ctx) {
        var insp = getCurrentInstance().proxy;
        var init = props.init, cache = props.cache;
        var map = cache;
        if (!map) {
            var container = document.createElement('div');
            container.style.cssText = 'position:absolute;top:0;right:0;bottom:0;left:0;';
            map = new mapboxgl.Map(__assign(__assign({}, init), { container: container }));
        }
        ensure_ctx_expose(ctx);
        ctx.expose({ map: map });
        provide(SYMBOL_MAP, map);
        var is_map_loaded = shallowRef(false);
        onMounted(function () {
            insp.$el.appendChild(map.getContainer());
            map.resize();
            // insp.$nextTick().then(() => map.resize());
            is_map_loaded.value = map.isStyleLoaded();
            if (!is_map_loaded.value) {
                map.once('load', function () { return (is_map_loaded.value = true); });
            }
        });
        var wrapper_style = {
            width: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
        };
        return function () {
            var _a, _b;
            return h('div', { style: wrapper_style }, [is_map_loaded.value && ((_b = (_a = ctx.slots).default) === null || _b === void 0 ? void 0 : _b.call(_a))]);
        };
    },
});
export var MglEvent = defineComponent({
    name: 'MglEvent',
    props: {
        init_type: {
            type: String,
            required: true,
        },
        init_layer_id: String,
    },
    emits: ['callback'],
    setup: function (props, ctx) {
        var map = inject(SYMBOL_MAP);
        var layer_id = props.init_layer_id || inject(SYMBOL_LAYER_ID);
        if (layer_id) {
            map.on(props.init_type, layer_id, function (e) { return ctx.emit('callback', e); });
        }
        else {
            map.on(props.init_type, function (e) { return ctx.emit('callback', e); });
        }
        return function () { var _a, _b; return h('div', [(_b = (_a = ctx.slots).default) === null || _b === void 0 ? void 0 : _b.call(_a)]); };
    },
});
export var MglImages = defineComponent({
    name: 'MglImages',
    props: {
        init_imgs: {
            type: Object,
            required: true,
        },
    },
    setup: function (props, ctx) {
        var init_imgs = props.init_imgs;
        var map = inject(SYMBOL_MAP);
        var load_img = function (name, url) {
            return new Promise(function (res, rej) {
                map.loadImage(url, function (err, img) {
                    if (err)
                        return rej(err);
                    map.addImage(name, img);
                    res(img);
                });
            });
        };
        var unload_imgs = function () {
            Object.keys(init_imgs).forEach(function (name) { return map.hasImage(name) && map.removeImage(name); });
        };
        var is_imgs_loaded = shallowRef(false);
        Promise.all(Object.keys(init_imgs).map(function (name) { return load_img(name, init_imgs[name]); })).then(function (_) { return (is_imgs_loaded.value = true); }, function (err) {
            unload_imgs();
            throw err;
        });
        onUnmounted(function () { return unload_imgs(); });
        return function () { var _a, _b; return h('div', [is_imgs_loaded.value && ((_b = (_a = ctx.slots).default) === null || _b === void 0 ? void 0 : _b.call(_a))]); };
    },
});
export var MglSource = defineComponent({
    name: 'MglSource',
    props: {
        init_id: String,
        source: {
            type: Object,
            required: true,
        },
    },
    setup: function (props, ctx) {
        var map = inject(SYMBOL_MAP);
        var source_id = props.init_id || new_id();
        provide(SYMBOL_SOURCE_ID, source_id);
        map.addSource(source_id, props.source);
        onUnmounted(function () { return map.removeSource(source_id); });
        watch(function () { return props.source; }, function (cv) {
            var s = map.getSource(source_id);
            if (s.type === 'geojson') {
                s.setData(cv.data);
            }
            if (s.type === 'canvas') {
                var _cv = cv;
                s.setCoordinates(_cv.coordinates);
                _cv.animate ? s.play() : s.pause();
            }
            if (s.type === 'image') {
                s.updateImage(cv);
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
                s.setCoordinates(cv.coordinates);
            }
        });
        return function () { var _a, _b; return h('div', [(_b = (_a = ctx.slots).default) === null || _b === void 0 ? void 0 : _b.call(_a)]); };
    },
});
export var MglGeojsonSource = defineComponent({
    name: 'MglGeojsonSource',
    props: {
        init_id: String,
        init: Object,
        data: Object,
    },
    setup: function (props, ctx) {
        var source = computed(function () {
            return __assign(__assign({}, props.init), { data: props.data, type: 'geojson' });
        });
        return function () {
            var _a, _b;
            var _props = { init_id: props.init_id, source: source.value };
            return h('div', [h(MglSource, isVue2 ? { props: _props } : _props, [(_b = (_a = ctx.slots).default) === null || _b === void 0 ? void 0 : _b.call(_a)])]);
        };
    },
});
export var MglCanvasSource = defineComponent({
    name: 'MglCanvasSource',
    props: {
        init_id: String,
        init_canvas: [String, Object],
        coordinates: Array,
        animate: Boolean,
    },
    setup: function (props, ctx) {
        var insp = getCurrentInstance().proxy;
        var init_canvas = props.init_canvas;
        var should_create_canvas = !init_canvas;
        var canvas_ref = shallowRef(init_canvas);
        onMounted(function () {
            if (should_create_canvas) {
                canvas_ref.value = insp.$refs.canvas;
            }
        });
        var source = computed(function () {
            return {
                canvas: canvas_ref.value,
                coordinates: props.coordinates,
                animate: props.animate,
            };
        });
        return function () {
            var _a, _b;
            var _props = { init_id: props.init_id, source: source.value };
            return h('div', [
                should_create_canvas && h('canvas', { ref: 'canvas', attrs: ctx.attrs }),
                canvas_ref.value && h(MglSource, isVue2 ? { props: _props } : _props, [(_b = (_a = ctx.slots).default) === null || _b === void 0 ? void 0 : _b.call(_a)]),
            ]);
        };
    },
});
export var MglLayer = defineComponent({
    name: 'MglLayer',
    props: {
        init_id: String,
        before_id: String,
        layer: {
            type: Object,
            required: true,
        },
    },
    setup: function (props, ctx) {
        var map = inject(SYMBOL_MAP);
        var source_id = inject(SYMBOL_SOURCE_ID);
        var layer_id = props.init_id || new_id();
        provide(SYMBOL_LAYER_ID, layer_id);
        map.addLayer(__assign(__assign({}, props.layer), { id: layer_id, source: source_id }));
        onUnmounted(function () { return map.removeLayer(layer_id); });
        // // 不是 用 watch.immediate.true 来立即设置 before_id, 而是在 onMounted 里去设置是避免 before_id 不存在
        // onMounted(() => map.moveLayer(layer_id, props.before_id));
        watch(function () { return props.before_id; }, function (cv) { return map.moveLayer(layer_id, cv); }, { immediate: true });
        watch(function () { return props.layer; }, function (cv, pv, inv) {
            var _a = cv || {}, _b = _a.layout, layout = _b === void 0 ? {} : _b, _c = _a.paint, paint = _c === void 0 ? {} : _c, filter = _a.filter, minzoom = _a.minzoom, maxzoom = _a.maxzoom, other = __rest(_a, ["layout", "paint", "filter", "minzoom", "maxzoom"]);
            var l = map.getLayer(layer_id);
            Object.keys(layout).forEach(function (key) { return map.setLayoutProperty(layer_id, key, layout[key]); });
            Object.keys(paint).forEach(function (key) { return map.setPaintProperty(layer_id, key, paint[key]); });
            map.setFilter(layer_id, filter);
            map.setLayerZoomRange(layer_id, minzoom, maxzoom);
            Object.assign(l, __assign(__assign({}, other), { id: layer_id, source: source_id }));
            map.triggerRepaint();
        });
        return function () { var _a, _b; return h('div', [(_b = (_a = ctx.slots).default) === null || _b === void 0 ? void 0 : _b.call(_a)]); };
    },
});
export var MglOriginMarker = defineComponent({
    name: 'MglOriginMarker',
    props: {
        lng_lat: {
            type: [Object, Array],
            required: true,
        },
    },
    setup: function (props, ctx) {
        var insp = getCurrentInstance().proxy;
        var map = inject(SYMBOL_MAP);
        var div = document.createElement('div');
        var marker = new mapboxgl.Marker(div);
        ensure_ctx_expose(ctx);
        ctx.expose({ marker: marker });
        watch(function () { return props.lng_lat; }, function (cv) {
            marker.setLngLat(cv);
            marker.addTo(map);
        }, { immediate: true });
        onMounted(function () {
            var content_div = insp.$el.firstElementChild;
            div.appendChild(content_div);
            onBeforeUnmount(function () {
                insp.$el.appendChild(content_div);
                marker.remove();
            });
            // TODO: 其实应该是有 onBeforeUpdate 时把 dom 移回来, onUpdated 时再移回去的逻辑, 但是这样性能并不是很好, 而且 css 动画都会重新播放, 体验不是很好.
            // 基于 vue vdom 都有对应的真实 dom 的引用, 本身并没有严格检查真实 dom 的结构, 下面又把 slot 包装进一个 div 里去了, 所以也不会有问题. Popup 同样如此
        });
        return function () { var _a, _b; return h('div', [h('div', [(_b = (_a = ctx.slots).default) === null || _b === void 0 ? void 0 : _b.call(_a)])]); };
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
export var MglOriginPopup = defineComponent({
    name: 'MglOriginPopup',
    props: {
        init: Object,
        lng_lat: [Object, Array],
    },
    setup: function (props, ctx) {
        var insp = getCurrentInstance().proxy;
        var map = inject(SYMBOL_MAP);
        var div = document.createElement('div');
        var popup = new mapboxgl.Popup(props.init);
        ensure_ctx_expose(ctx);
        ctx.expose({ popup: popup });
        popup.setDOMContent(div);
        watch(function () { return props.lng_lat; }, function (cv) {
            cv ? popup.setLngLat(cv) : popup.trackPointer();
            popup.addTo(map);
        }, { immediate: true });
        onMounted(function () {
            var content_div = insp.$el.firstElementChild;
            div.appendChild(content_div);
            onBeforeUnmount(function () {
                insp.$el.appendChild(content_div);
                popup.remove();
            });
        });
        return function () { var _a, _b; return h('div', [h('div', [(_b = (_a = ctx.slots).default) === null || _b === void 0 ? void 0 : _b.call(_a)])]); };
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
