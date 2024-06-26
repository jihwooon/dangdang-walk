import BottomSheet from '@/components/commons/BottomSheet';
import Map from '@/components/walk/Map';
import WalkHeader from '@/components/walk/WalkHeader';
import WalkInfo from '@/components/walk/WalkInfo';
import WalkNavbar from '@/components/walk/WalkNavbar';
import { DEFAULT_WALK_MET, DEFAULT_WEIGHT } from '@/constants';
import useGeolocation from '@/hooks/useGeolocation';
import useStopWatch from '@/hooks/useStopWatch';
import useWalkingDogs from '@/hooks/useWalkingDogs';
import { useEffect, useState } from 'react';

import { requestWalkStart, requestWalkStop } from '@/api/walk';
import DogFecesAndUrineCheckList from '@/components/walk/DogFecesAndUrineCheckList';
import StopToast from '@/components/walk/StopToast';
import { storageKeys } from '@/constants';
import useImageUpload from '@/hooks/useImageUpload';
import useAlertToast from '@/hooks/useAlertToast';
import useToast from '@/hooks/useToast';
import { DogAvatar, WalkingDog } from '@/models/dog';
import { Position } from '@/models/location';
import { useStore } from '@/store';
import { getStorage, removeStorage, setStorage } from '@/utils/storage';
import { useLocation, useNavigate } from 'react-router-dom';

export interface DogWalkData {
    dogs: WalkingDog[] | DogAvatar[];
    startedAt: string | undefined;
    distance: number | undefined;
    routes: Position[] | undefined;
    photoUrls: string[] | undefined;
}
export interface JournalCreateFromState extends DogWalkData {
    calories: number;
}

export default function Walk() {
    const location = useLocation();
    const navigate = useNavigate();

    const { walkingDogs, saveFecesAndUrine, initialSetDogs, handleToggle, cancelCheckedAll } = useWalkingDogs();
    const { duration, isStart: isWalk, stopClock, startClock, startedAt } = useStopWatch();
    const { distance, position: startPosition, currentPosition, stopGeo, routes, startGeo } = useGeolocation();
    const [isDogBottomSheetOpen, setIsDogBottomSheetOpen] = useState<boolean>(false);

    const { uploadedImageUrls: photoUrls, handleFileChange, setUploadedImageUrls: setPhotoUrls } = useImageUpload();
    const { showAlertToast: showStopAlert, isShowAlert: isShowStopAlert } = useAlertToast();
    const { show: showToast } = useToast();
    const spinnerAdd = useStore((state) => state.spinnerAdd);
    const spinnerRemove = useStore((state) => state.spinnerRemove);

    const handleBottomSheet = () => {
        setIsDogBottomSheetOpen(!isDogBottomSheetOpen);
        if (isDogBottomSheetOpen) {
            cancelCheckedAll();
        }
    };

    const handleConfirm = () => {
        saveFecesAndUrine(currentPosition);
        setIsDogBottomSheetOpen(false);
        showToast('용변기록이 저장되었습니다 :)');
    };

    const stopWalk = async (dogs: WalkingDog[] | null) => {
        if (!dogs) return;
        spinnerAdd();
        stopClock();
        stopGeo();
        const ok = await requestWalkStop(dogs.map((d) => d.id));
        if (ok) {
            removeStorage(storageKeys.DOGS);
            navigate('/journals/create', {
                state: { dogs, distance, duration, calories: getCalories(duration), startedAt, routes, photoUrls },
            });
        }
        spinnerRemove();
    };

    const handleWalkStop = (isStop: boolean) => {
        if (!isWalk) return;
        if (isStop) {
            stopWalk(walkingDogs);
        } else {
            showStopAlert();
        }
    };
    const handleWalkStart = (dogData: DogWalkData) => {
        initialSetDogs(dogData.dogs);
        startClock(dogData.startedAt);
        startGeo(dogData.distance, dogData.routes);
        setPhotoUrls(dogData.photoUrls ?? []);
    };
    const getCalories = (time: number) => Math.round((DEFAULT_WALK_MET * DEFAULT_WEIGHT * time) / 3600);

    useEffect(() => {
        if (!routes || !startedAt || !walkingDogs) return;
        const walkDogData: DogWalkData = {
            dogs: walkingDogs,
            startedAt: startedAt,
            distance: distance,
            routes: routes,
            photoUrls: photoUrls,
        };
        setStorage(storageKeys.DOGS, JSON.stringify(walkDogData));
    }, [walkingDogs, startedAt, distance, routes, photoUrls]);

    useEffect(() => {
        const dogData = (
            getStorage(storageKeys.DOGS) ? JSON.parse(getStorage(storageKeys.DOGS) ?? '') : location.state
        ) as DogWalkData;
        if (!dogData) {
            navigate('/');
            return;
        }
        const startDogWalk = async (data: DogWalkData) => {
            const ok = await requestWalkStart(data.dogs.map((dog) => dog.id));
            if (ok) {
                handleWalkStart(data);
            } else {
                navigate('/');
                removeStorage(storageKeys.DOGS);
            }
        };
        if (getStorage(storageKeys.DOGS)) {
            handleWalkStart(dogData);
        } else {
            startDogWalk(dogData);
        }
    }, []);

    return (
        <div className="inset-0 h-dvh overflow-hidden">
            <WalkHeader />
            <WalkInfo duration={duration} calories={getCalories(duration)} distance={distance} />

            <Map startPosition={startPosition} path={routes} />

            <StopToast isVisible={isShowStopAlert} />
            <WalkNavbar onOpen={handleBottomSheet} onStop={handleWalkStop} onChange={handleFileChange} />

            <BottomSheet isOpen={isDogBottomSheetOpen} onClose={handleBottomSheet}>
                <BottomSheet.Header> 강아지 산책</BottomSheet.Header>
                <BottomSheet.Body>
                    {walkingDogs?.map((dog) => (
                        <DogFecesAndUrineCheckList dog={dog} toggleCheck={handleToggle} key={dog.id} />
                    ))}
                </BottomSheet.Body>
                <BottomSheet.ConfirmButton
                    onConfirm={handleConfirm}
                    disabled={walkingDogs?.find((d) => d.isUrineChecked || d.isFecesChecked) ? false : true}
                >
                    확인
                </BottomSheet.ConfirmButton>
            </BottomSheet>
        </div>
    );
}
