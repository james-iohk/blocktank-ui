import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './';
import { IGetInfoResponse, IGetOrderResponse } from '../utils/client/types';
import crClient from '../utils/client';

type RequestState = 'idle' | 'loading' | 'error';

export type CRState = {
	info: {
		state: RequestState;
		value: IGetInfoResponse;
	};
	orders: {
		state: RequestState;
		value: IGetOrderResponse[];
	};
};

const initialState: CRState = {
	info: {
		state: 'idle',
		value: {
			capacity: { local_balance: 0, remote_balance: 0 },
			services: [],
			node_info: { active_channels_count: 0, alias: '', public_key: '', uris: [] }
		}
	},
	orders: {
		state: 'idle',
		value: []
	}
};

export const refreshInfo = createAsyncThunk('cr/refreshInfo', async() => {
	const response = await crClient.getInfo();
	// The value we return becomes the `fulfilled` action payload
	return response;
});

export const refreshOrder = createAsyncThunk('cr/refreshOrder', async(orderId: string) => {
	const response = await crClient.getOrder(orderId);
	// The value we return becomes the `fulfilled` action payload
	return response;
});

export const cr = createSlice({
	name: 'cr',
	initialState,
	// The `reducers` field lets us define reducers and generate associated actions
	reducers: {
		increment: (state) => {
			state.info.value.capacity.local_balance += 1;
		},
		decrement: (state) => {
			state.info.value.capacity.local_balance -= 1;
		},
		incrementByAmount: (state, action: PayloadAction<number>) => {
			state.info.value.capacity.local_balance += action.payload;
		}
	},
	// The `extraReducers` field lets the slice handle actions defined elsewhere,
	// including actions generated by createAsyncThunk or in other slices.
	extraReducers: (builder) => {
		builder
			// Refresh info state updates
			.addCase(refreshInfo.pending, (state) => {
				state.info.state = 'loading';
			})
			.addCase(refreshInfo.rejected, (state) => {
				state.info.state = 'error';
			})
			.addCase(refreshInfo.fulfilled, (state, action) => {
				state.info.state = 'idle';
				state.info.value = action.payload;
			})

			// Refresh single order state updates
			.addCase(refreshOrder.pending, (state) => {
				state.orders.state = 'loading';
			})
			.addCase(refreshOrder.rejected, (state) => {
				state.orders.state = 'error';
			})
			.addCase(refreshOrder.fulfilled, (state, action) => {
				state.orders.state = 'idle';

				const updatedOrder = action.payload;

				const orders = state.orders.value;
				let existingOrderIndex = -1;
				orders.forEach((o, index) => {
					if (o._id === updatedOrder._id) {
						existingOrderIndex = index;
					}
				});

				if (existingOrderIndex > -1) {
					state.orders.value[existingOrderIndex] = updatedOrder;
				} else {
					state.orders.value.push(updatedOrder);
				}
			});
	}
});

export const { increment, decrement, incrementByAmount } = cr.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
export const selectInfo = (state: RootState): IGetInfoResponse => state.cr.info.value;
export const selectInfoState = (state: RootState): RequestState => state.cr.info.state;

export const selectOrders = (state: RootState): IGetOrderResponse[] => state.cr.orders.value;
export const selectOrdersState = (state: RootState): RequestState => state.cr.orders.state;

export default cr.reducer;