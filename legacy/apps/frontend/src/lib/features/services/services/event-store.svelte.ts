let _refreshServiceList = $state(0);

export const refreshServiceList = {
    get value() { return _refreshServiceList; },
    set value(v) { _refreshServiceList = v; },
    update(fn: (v: number) => number) {
        _refreshServiceList = fn(_refreshServiceList);
    },
    set(v: number) {
        _refreshServiceList = v;
    }
};
