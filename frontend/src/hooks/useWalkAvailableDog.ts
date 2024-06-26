import { fetchWalkAvailableDogs } from '@/api/dog';
import { queryKeys } from '@/constants';
import { WalkAvailableDog } from '@/models/dog';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

type AvailableDogData = ReadonlyArray<Omit<WalkAvailableDog, 'isChecked'>>;

const useWalkAvailable = () => {
    const [walkAvailableDogs, setWalkAvailableDogs] = useState<WalkAvailableDog[] | undefined>([]);

    const {
        data: availableDogData,
        isLoading,
        refetch,
    } = useQuery<AvailableDogData>({
        queryKey: [queryKeys.WALK_AVAILABLE_DOGS],
        queryFn: fetchWalkAvailableDogs,
        enabled: false,
    });

    useEffect(() => {
        if (!availableDogData) return;
        setWalkAvailableDogs(
            availableDogData.map((availableDog) => {
                return {
                    ...availableDog,
                    isChecked: false,
                };
            })
        );
    }, [availableDogData]);

    return {
        walkAvailableDogs,
        setWalkAvailableDogs,
        isAvailableDogsLoading: isLoading,
        fetchWalkAvailableDogs: refetch,
    };
};

export default useWalkAvailable;
