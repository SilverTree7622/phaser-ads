module PhaserAds {
    export module AdProvider {
        export class CordovaGameDistribution implements PhaserAds.AdProvider.IProvider {
            public adManager: AdManager;

            public adsEnabled: boolean = false;

            constructor(game: Phaser.Game, gameId: string, userId: string, debug: boolean = false) {
                if (cordova.plugins === undefined ||
                    (cordova.plugins !== undefined && cordova.plugins.gdApi === undefined)
                ) {
                    console.log('gdApi not available!');
                    return;
                }

                if (debug) {
                    cordova.plugins.gdApi.enableTestAds();
                }

                this.setAdListeners();
                (<CordovaPluginGdApi>cordova.plugins.gdApi).init([
                    gameId,
                    userId
                ], (data: any) => {
                    console.log('API init success!', data);
                }, (error: any) => {
                    console.log('API init error!', error);
                });
            }

            private setAdListeners(): void {
                (<CordovaPluginGdApi>cordova.plugins.gdApi).setAdListener((data: any) => {
                    console.log('banner reply, data.event', data.event, data);
                    switch (data.event) {
                        case 'BANNER_STARTED':
                            this.adManager.onContentPaused.dispatch();
                            break;
                        case 'API_IS_READY':
                            //Send post init
                            this.adsEnabled = true;
                            break;
                        case 'API_ALREADY_INITIALIZED':
                            break;
                        case 'BANNER_CLOSED':
                        case 'API_NOT_READY':
                        case 'BANNER_FAILED':
                            this.adManager.onContentResumed.dispatch();
                            break;
                    }
                }, (error: any) => {
                    console.log('Set listener error:', error);
                    this.adsEnabled = false;
                });
            }

            public setManager(manager: PhaserAds.AdManager): void {
                this.adManager = manager;
            }

            public showAd(adType?: AdType): void {
                if (this.adsEnabled) {
                    console.log('show banner called');
                    (<CordovaPluginGdApi>cordova.plugins.gdApi).showBanner((data: any) => {
                        console.log('Show banner worked', data);
                    }, (data: any) => {
                        console.log('Could not show banner:', data);
                        this.adManager.onContentResumed.dispatch();
                    });
                } else {
                    console.log('Ads not enabled, resuming');
                    this.adManager.onContentResumed.dispatch();
                }
            }

            //Does nothing, but needed for Provider interface
            public preloadAd(): void {
                return;
            }

            //Does nothing, but needed for Provider interface
            public destroyAd(): void {
                return;
            }

            //Does nothing, but needed for Provider interface
            public hideAd(): void {
                return;
            }
        }
    }
}
