/* eslint-disable no-unused-expressions */
import { expect } from 'chai';

import { hexToRgb } from '../src/utils';

describe('utils', () => {
  describe('hexToRgb', () => {
    it('successfully parsed value', () => {
      const colors = hexToRgb('#ffffff');
      expect(colors.red).to.be.equal(255);
      expect(colors.blue).to.be.equal(255);
      expect(colors.green).to.be.equal(255);
    });

    it('failed to parse the value', () => {
      const colors = hexToRgb('rewerwe');
      expect(colors).to.be.null;
    });
  });
});
