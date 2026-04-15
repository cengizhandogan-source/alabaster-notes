import { Facet } from "@codemirror/state"

export const readOnlyFacet = Facet.define<boolean, boolean>({
  combine: (values) => values.some((v) => v),
})
