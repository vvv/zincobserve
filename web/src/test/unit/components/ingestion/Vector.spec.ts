import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { installQuasar } from "../../helpers/install-quasar-plugin";

import Vector from "../../../../components/ingestion/Vector.vue";

installQuasar();

describe("Vector", async () => {
  it("should mount Vector", async () => {
    const wrapper = mount(Vector, {
      shallow: false,
      props: {
        currOrgIdentifier: "zinc_next",
        currUserEmail: "tulsiraval2828@gmail.com",
        orgAPIKey: 'L"4R{8f~56e72`0319V',
      },
    });

    expect(wrapper.vm.currOrgIdentifier).not.toBe("");
    expect(wrapper.vm.currUserEmail).not.toBe("");
  });
});
