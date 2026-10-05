// SPDX-License-Identifier: MPL-2.0
// Registers happy-dom globals once per test process, however many files import it.
import { GlobalRegistrator } from '@happy-dom/global-registrator';

if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register({
    url: 'http://localhost/docs/deep/page.html',
    settings: { disableCSSFileLoading: true, handleDisabledFileLoadingAsSuccess: true },
  });
