import "leaflet-draw";

declare module "leaflet" {
  namespace Control {
    class Draw extends L.Control {
      constructor(options?: L.Control.DrawConstructorOptions);
    }
  }

  namespace Control.DrawOptions {
    interface DrawOptions {
      position?: string;
      draw?: DrawOptions;
      edit?: EditOptions;
    }
  }

  namespace Control {
    interface DrawConstructorOptions extends ControlOptions {
      position?: string;
      draw?: DrawOptions;
      edit?: EditOptions;
    }
  }

  interface DrawOptions {
    polygon?: PolygonOptions;
    // Add other draw options as needed
  }

  interface PolygonOptions {
    allowIntersection?: boolean;
    showArea?: boolean;
    metric?: boolean;
    guidelineDistance?: number;
    // Add other polygon options as needed
  }

  interface EditOptions {
    featureGroup: L.FeatureGroup;
    // Add other edit options as needed
  }
}

declare module "leaflet-draw" {
  export * from "leaflet-draw";
}
