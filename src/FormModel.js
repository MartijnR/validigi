/**
 * @class FormModel
 *
 * @description Class imported from Enketo Core.
 *
 * @see {@link https://enketo.github.io/enketo-core/FormModel.html|Enketo Core documentation}
 */

import { FormModel } from 'enketo-core';

/**
 * @type {Function}
 * @see {@link https://github.com/OpenClinica/enketo-xpath-extensions-oc|addXPathExtensionsOc}
 */
import addXPathExtensionsOc from 'enketo-xpath-extensions-oc';

window.FormModel = FormModel;
window.addXPathExtensionsOc = addXPathExtensionsOc;
