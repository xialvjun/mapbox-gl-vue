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
import "mapbox-gl/dist/mapbox-gl.css";
import mgl from "mapbox-gl";
import * as Vue from "vue";
var is_2 = !(Vue.version || "").startsWith("3");
var defineComponent = function (options) {
    if (is_2) {
        options.beforeDestroy = options.beforeUnmount;
        options.destroyed = options.unmounted;
        return Vue.default.extend(options);
    }
    return Vue.defineComponent(options);
};
var get_h = function (h) { return (typeof h === "function" ? h : Vue.h); };
var get_children = function (that) {
    return (typeof that.$slots.default === "function" ? that.$slots.default() : that.$slots.default);
};
var new_id = (function (num) { return function () { return "_" + (num++ + Math.random()).toString(36).replace(".", "_"); }; })(0);
var replace_dom = function (to_replace, replace) {
    var parent = to_replace.parentNode;
    parent.insertBefore(replace, to_replace);
    parent.removeChild(to_replace);
};
export var Map = defineComponent({
    name: "MglMap",
    props: {
        init: Object,
        cache: Object,
    },
    data: function () {
        var map = this.cache;
        if (!map) {
            var container = document.createElement("div");
            container.style.cssText = "position:absolute;top:0;right:0;bottom:0;left:0;";
            map = new mgl.Map(__assign(__assign({}, this.init), { container: container }));
        }
        var is_style_loaded = map.isStyleLoaded();
        return { map: map, is_style_loaded: is_style_loaded };
    },
    render: function (h) {
        h = get_h(h);
        return h("div", { style: "position:relative;overflow:hidden;width:100%;height:100%;" }, [this.is_style_loaded && get_children(this)]);
    },
    mounted: function () {
        var _this = this;
        var _a = this, map = _a.map, is_style_loaded = _a.is_style_loaded;
        this.$el.appendChild(map.getContainer());
        map.resize();
        if (!is_style_loaded) {
            map.once("load", function () {
                _this.is_style_loaded = true;
            });
        }
    },
    provide: function () {
        return { init_map: this.map };
    },
});
export var MglMap = Map;
export var Images = defineComponent({
    name: "MglImages",
    props: {
        init_imgs: {
            type: Object,
            required: true,
        },
    },
    inject: ["init_map"],
    data: function () {
        return { is_imgs_loaded: false, map: this.init_map, imgs: __assign({}, this.init_imgs) };
    },
    render: function (h) {
        h = get_h(h);
        return h("div", [this.is_imgs_loaded && get_children(this)]);
    },
    methods: {
        load_img: function (name, url) {
            var map = this.map;
            return new Promise(function (res, rej) {
                map.loadImage(url, function (err, img) {
                    if (err)
                        return rej(err);
                    res(map.addImage(name, img));
                });
            });
        },
        unload_imgs: function () {
            var _a = this, map = _a.map, imgs = _a.imgs;
            Object.keys(imgs).forEach(function (name) { return map.hasImage(name) && map.removeImage(name); });
        },
    },
    beforeMount: function () {
        var _this = this;
        var _a = this, map = _a.map, imgs = _a.imgs;
        Promise.all(Object.keys(imgs).map(function (name) { return _this.load_img(name, imgs[name]); })).then(function (_) { return (_this.is_imgs_loaded = true); }, function (err) {
            _this.unload_imgs();
            throw err;
        });
    },
    unmounted: function () {
        this.unload_imgs();
    },
});
export var MglImages = Images;
export var Source = defineComponent({
    name: "MglSource",
    props: {
        source: {
            type: Object,
            required: true,
        },
    },
    inject: ["init_map"],
    data: function () {
        return { source_id: new_id(), map: this.init_map };
    },
    render: function (h) {
        h = get_h(h);
        return h("div", [get_children(this)]);
    },
    provide: function () {
        return { init_source_id: this.source_id };
    },
    beforeMount: function () {
        this.map.addSource(this.source_id, this.source);
    },
    unmounted: function () {
        this.map.removeSource(this.source_id);
    },
    watch: {
        source: function (cv, pv) {
            var s = this.map.getSource(this.source_id);
            if (s.type === "geojson") {
                s.setData(cv.data);
            }
            if (s.type === "canvas") {
                var _cv = cv;
                s.setCoordinates(_cv.coordinates);
                _cv.animate ? s.play() : s.pause();
            }
            if (s.type === "image") {
                s.updateImage(cv);
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
                s.setCoordinates(cv.coordinates);
            }
        },
    },
});
export var MglSource = Source;
export var GeojsonSource = defineComponent({
    name: "MglGeojsonSource",
    props: {
        init: Object,
        data: Object,
    },
    data: function () {
        return { _init: __assign({}, this.init) };
    },
    computed: {
        source: function () {
            var _a = this, _init = _a._init, data = _a.data;
            return __assign(__assign({}, _init), { data: data, type: "geojson" });
        },
    },
    render: function (h) {
        h = get_h(h);
        var props = { source: this.source };
        return h(Source, is_2 ? { props: props } : props, [get_children(this)]);
    },
});
export var MglGeojsonSource = GeojsonSource;
export var Layer = defineComponent({
    name: "MglLayer",
    props: {
        init_id: String,
        before_id: String,
        layer: {
            type: Object,
            required: true,
        },
    },
    inject: ["init_map", "init_source_id"],
    data: function () {
        return {
            layer_id: this.init_id || new_id(),
            map: this.init_map,
            source_id: this.init_source_id,
        };
    },
    render: function (h) {
        return null;
    },
    provide: function () {
        return { init_layer_id: this.layer_id };
    },
    beforeMount: function () {
        this.map.addLayer(__assign(__assign({}, this.layer), { id: this.layer_id, source: this.source_id }));
        this.map.moveLayer(this.layer_id, this.before_id);
    },
    unmounted: function () {
        this.map.removeLayer(this.layer_id);
    },
    watch: {
        before_id: function (cv, pv) {
            this.map.moveLayer(this.layer_id, cv);
        },
        layer: function (cv, pv) {
            var _a = this, map = _a.map, layer_id = _a.layer_id, source_id = _a.source_id;
            var _b = cv || {}, _c = _b.layout, layout = _c === void 0 ? {} : _c, _d = _b.paint, paint = _d === void 0 ? {} : _d, filter = _b.filter, minzoom = _b.minzoom, maxzoom = _b.maxzoom, other = __rest(_b, ["layout", "paint", "filter", "minzoom", "maxzoom"]);
            var l = map.getLayer(layer_id);
            Object.keys(layout).forEach(function (key) { return map.setLayoutProperty(layer_id, key, layout[key]); });
            Object.keys(paint).forEach(function (key) { return map.setPaintProperty(layer_id, key, paint[key]); });
            map.setFilter(layer_id, filter);
            map.setLayerZoomRange(layer_id, minzoom, maxzoom);
            Object.assign(l, __assign(__assign({}, other), { id: layer_id, source: source_id }));
            map.triggerRepaint();
        },
    },
});
export var MglLayer = Layer;
export var Event = defineComponent({
    name: "MglEvent",
    props: {
        init_type: {
            type: String,
            required: true,
        },
        init_layer: String,
        // @callback
    },
    inject: ["init_map", "init_layer_id"],
    data: function () {
        var callback = function (e) {
            this.$emit("callback", e);
        };
        callback = callback.bind(this);
        return {
            map: this.init_map,
            type: this.init_type,
            layer: this.init_layer || this.init_layer_id,
            callback: callback,
        };
    },
    render: function (h) {
        return null;
    },
    beforeMount: function () {
        var _a = this, map = _a.map, type = _a.type, layer = _a.layer, callback = _a.callback;
        if (layer) {
            map.on(type, layer, callback);
        }
        else {
            map.on(type, callback);
        }
    },
    unmounted: function () {
        var _a = this, map = _a.map, type = _a.type, layer = _a.layer, callback = _a.callback;
        if (layer) {
            map.off(type, layer, callback);
        }
        else {
            map.off(type, callback);
        }
    },
});
export var MglEvent = Event;
// ! OriginMarker 对应真实 dom 的顺序 与 vdom 的顺序会不一致
export var OriginMarker = defineComponent({
    name: "MglOriginMarker",
    props: {
        lng_lat: {
            type: [Object, Array],
            required: true,
        },
    },
    inject: ["init_map"],
    data: function () {
        var map = this.init_map;
        var div = document.createElement("div");
        var map_place = document.createComment("");
        var vue_place = document.createComment("");
        div.appendChild(map_place);
        var marker = new mgl.Marker(div);
        marker.setLngLat(this.lng_lat);
        marker.addTo(map);
        return { map: map, div: div, map_place: map_place, vue_place: vue_place, marker: marker, ele: null };
    },
    render: function (h) {
        h = get_h(h);
        // 两层 div 是避免 $slots.default 是多元素 fragment
        return h("div", { class: "fasfaf" }, [h("div", [get_children(this)])]);
    },
    methods: {
        copy_css: function () {
            var _a;
            this.div.className = this.div.className
                .split(/\s/)
                .filter(function (it) { return it.startsWith("mapboxgl-"); })
                .concat(this.$el.className)
                .join(" ");
            this.div.style.cssText = ((_a = this.div.style.cssText.match(/(transform\:\s.+\;)/)) === null || _a === void 0 ? void 0 : _a[1]) + this.$el.style.cssText;
        },
        replace_in: function () {
            replace_dom(this.ele, this.vue_place);
            replace_dom(this.map_place, this.ele);
        },
        replace_out: function () {
            replace_dom(this.ele, this.map_place);
            replace_dom(this.vue_place, this.ele);
        },
    },
    mounted: function () {
        this.ele = this.$el.firstElementChild;
        this.copy_css();
        this.replace_in();
    },
    beforeUpdate: function () {
        this.replace_out();
    },
    updated: function () {
        this.copy_css();
        this.replace_in();
    },
    beforeUnmount: function () {
        this.replace_out();
        this.marker.remove();
    },
    watch: {
        lng_lat: function (cv, pv) {
            this.marker.setLngLat(cv);
            this.marker.addTo(this.map);
        },
    },
});
export var MglOriginMarker = OriginMarker;
// ! OriginPopup 对应真实 dom 的顺序 与 vdom 的顺序会不一致
// ! 默认创建的 Popup 有 closeOnClick=true, 只要改变下 lng_lat 造成重新执行 addTo(map) 就能再次显示. 也可通过 key 重新创建来控制.
export var OriginPopup = defineComponent({
    name: "MglOriginPopup",
    props: {
        init: Object,
        lng_lat: {
            type: [Object, Array],
            required: true,
        },
    },
    inject: ["init_map"],
    data: function () {
        var map = this.init_map;
        var div = document.createElement("div");
        var map_place = document.createComment("");
        var vue_place = document.createComment("");
        div.appendChild(map_place);
        var popup = new mgl.Popup(this.init);
        popup.setDOMContent(div);
        popup.setLngLat(this.lng_lat);
        popup.addTo(map);
        return { map: map, div: div, map_place: map_place, vue_place: vue_place, popup: popup, ele: ele };
    },
    render: function (h) {
        h = get_h(h);
        // 两层 div 是避免 $slots.default 是多元素 fragment
        return h("div", [h("div", [get_children(this)])]);
    },
    methods: {
        copy_css: function () {
            var _a;
            this.div.className = this.div.className
                .split(/\s/)
                .filter(function (it) { return it.startsWith("mapboxgl-"); })
                .concat(this.$el.className)
                .join(" ");
            this.div.style.cssText = ((_a = this.div.style.cssText.match(/(transform\:\s.+\;)/)) === null || _a === void 0 ? void 0 : _a[1]) + this.$el.style.cssText;
        },
        replace_in: function () {
            replace_dom(this.ele, this.vue_place);
            replace_dom(this.map_place, this.ele);
        },
        replace_out: function () {
            replace_dom(this.ele, this.map_place);
            replace_dom(this.vue_place, this.ele);
        },
    },
    mounted: function () {
        this.ele = this.$el.firstElementChild;
        this.copy_css();
        this.replace_in();
    },
    beforeUpdate: function () {
        this.replace_out();
    },
    updated: function () {
        this.copy_css();
        this.replace_in();
    },
    beforeUnmount: function () {
        this.replace_out();
        this.popup.remove();
    },
    watch: {
        lng_lat: function (cv, pv) {
            this.popup.setLngLat(cv);
            this.popup.addTo(this.map);
        },
    },
});
export var MglOriginPopup = OriginPopup;
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
