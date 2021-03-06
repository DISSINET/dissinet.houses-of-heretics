import { keys, toJS, observable, action, computed } from "mobx";
import { inferredPredicate } from "@babel/types";

export default class AppStore {
  _center;
  _zoom;
  _extent;
  _filters;
  _welcome;
  data;
  _panel;

  defaultFilters = [
    {
      id: "period-mode",
      label: "Period – mode",
      type: "radio",
      options: [
        {
          id: "or",
          label: "OR",
          active: true
        },
        {
          id: "and",
          label: "AND",
          active: false
        }
      ]
    },
    {
      id: "period-time",
      label: "Periods",
      type: "checkbox",
      options: [
        {
          id: "until 1209",
          label: "until 1209",
          active: true,
          fn: d => d.period1
        },
        {
          id: "1210–1219",
          label: "1210–1219",
          active: true,
          fn: d => d.period2
        },
        {
          id: "1220–1229",
          label: "1220–1229",
          active: true,
          fn: d => d.period3
        },
        {
          id: "1230–1244",
          label: "1230–1244",
          active: true,
          fn: d => d.period4
        },
        {
          id: "nodata",
          label: "no data",
          active: true,
          fn: d => d.period0
        }
      ]
    }
  ];

  constructor(data) {
    this._center = observable.box([43.2, 2]);
    this._zoom = observable.box(9);
    this._extent = observable.box([]);
    this._welcome = observable.box(true);
    this._panel = observable.box(true);

    this._filters = observable.box(this.defaultFilters);
    this.data = data;
  }

  @computed
  get welcome() {
    return toJS(this._welcome);
  }

  @computed
  get geoData() {
    return this.data.filter(d => d.geo);
  }

  @computed
  get panel() {
    return toJS(this._panel);
  }

  @computed
  get filters() {
    return toJS(this._filters);
  }

  @computed
  get center(): Array<Number> {
    return toJS(this._center);
  }

  @computed
  get zoom(): Number {
    return this._zoom.get();
  }

  @computed
  get extent(): Array<number> {
    return toJS(this._extent);
  }

  @computed
  get active(): Array<any> {
    return this.geoData.filter(d => this.isActive(d));
  }

  @computed
  get inactive(): Array<any> {
    return this.geoData.filter(d => !this.isActive(d));
  }

  isActive = d => {
    const modeGroup = this.filters.find(fg => fg.id === "period-mode");
    const orOption = modeGroup.options.find(o => o.id === "or");
    const or = orOption.active;

    const timePeriodsGroup = this.filters.find(fg => fg.id === "period-time");
    const timePeriodsOptionsActive = timePeriodsGroup.options.filter(
      o => o.active
    );
    if (timePeriodsOptionsActive.length) {
      return or
        ? timePeriodsOptionsActive.some(o => o.fn(d))
        : timePeriodsOptionsActive.every(o => o.fn(d));
    }
    return false;
  };

  @action
  mapMoved(
    newCenter: Array<Number>,
    newZoom: Number,
    newExtent: Array<Number>
  ): void {
    this._center.set(newCenter);
    this._zoom.set(newZoom);
    this._extent.set(newExtent);
  }

  @action
  togglePanel() {
    this._panel.set(!this.panel);
  }
  @action
  openWelcome() {
    this._welcome.set(true);
  }

  @action
  closeWelcome() {
    this._welcome.set(false);
  }

  @action activateFilter(groupId, optionId) {
    const newFilters = toJS(this.filters);
    const filterGroup = newFilters.find(f => f.id === groupId);
    if (filterGroup) {
      const filterOption = filterGroup.options.find(f => f.id === optionId);
      if (filterOption) {
        if (filterGroup.type === "checkbox") {
          filterOption.active = !filterOption.active;
        } else if (filterGroup.type === "radio") {
          filterGroup.options.forEach(o => (o.active = false));
          filterOption.active = true;
        }
      }
    }

    // and option exception
    if (optionId === "and") {
      const periodTime = newFilters.find(f => f.id === "period-time");
      if (periodTime) {
        const noTime = periodTime.options.find(o => o.id === "nodata");
        if (noTime) {
          noTime.active = false;
        }
      }
    }

    console.log(newFilters);

    this._filters.set(newFilters);
  }
}
