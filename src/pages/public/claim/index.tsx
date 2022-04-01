import React, { useState } from 'react';
import { useAppDispatch } from '../../../store/hooks';
import { navigate, refreshOrder } from '../../../store/public-store';
import bt from '@synonymdev/blocktank-client';
import FormCard from '../../../components/form-card';
import Spinner from '../../../components/spinner';
import QRCode from '../../../components/qr';
import InputGroup from '../../../components/input-group';
import Divider from '../../../components/divider';

import './index.scss';
import Heading from '../../../components/heading';
import Tooltip from '../../../components/tooltip';
import Checkbox from '../../../components/checkbox';
import { clipCenter } from '../../../utils/helpers';
import ActionButton from '../../../components/action-button';
import { ReactComponent as LightningIconActive } from '../../../icons/lightning-active.svg';
import { ReactComponent as ClaimIcon } from '../../../icons/claim-white.svg';
import { ReactComponent as QRIcon } from '../../../icons/qr-white.svg';
import { ReactComponent as LightningIcon } from '../../../icons/lightning-white.svg';
import useDisplayValues from '../../../hooks/displayValues';
import ErrorPage from '../error';
import useOrder from '../../../hooks/useOrder';

const qrSize = 200;

function ClaimPage(): JSX.Element {
	const [showManual, setShowManual] = useState(false);
	const [isPrivate, setIsPrivate] = useState(false);
	const [nodeUri, setNodeUri] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const dispatch = useAppDispatch();
	const { order, orderState } = useOrder();
	const inboundDisplay = useDisplayValues(Number(order?.local_balance));
	const myBalanceDisplay = useDisplayValues(Number(order?.remote_balance));

	if (!order) {
		if (orderState === 'loading' || orderState === 'idle') {
			return (
				<FormCard>
					<Spinner style={{ fontSize: 8 }} centered />
				</FormCard>
			);
		}

		return <ErrorPage type={'orderNotFound'} />;
	}

	const { _id, lnurl_string, remote_balance, local_balance, channel_expiry } = order;

	const claimChannel = async (): Promise<void> => {
		setIsSubmitting(true);
		try {
			await bt.finalizeChannel({
				order_id: _id,
				node_uri: nodeUri,
				private: isPrivate
			});

			await dispatch(refreshOrder(_id));

			dispatch(navigate({ page: 'order' }));
		} catch (e) {
			alert(e);
		} finally {
			setIsSubmitting(false);
		}
	};

	const onSetNodeUri = (uri: string): void => setNodeUri(uri);

	const autoClaim = (
		<>
			<div className='claim-channel-top'>
				<div className={'claim-channel-qr'}>
					<QRCode value={lnurl_string} size={qrSize} />
				</div>
				<div className={'claim-channel-details'}>
					<div className={'claim-channel-title'}>
						<span>Channel claim url</span>
						<Tooltip
							tip={{
								title: 'How to claim',
								body: 'Scan this QR code with a supported Lightning wallet with node capability. Or, copy the claim text and paste it within your full Lightning node. You may also claim the channel manually.'
							}}
						/>
					</div>
					<p className={'claim-channel-address'}>{clipCenter(lnurl_string, 42)}</p>
					<div>
						<ActionButton copyText={lnurl_string}>Copy claim url</ActionButton>
						<div className={'claim-channel-button-spacer'} />
						<ActionButton onClick={() => setShowManual(true)} Icon={ClaimIcon}>
							Claim manually
						</ActionButton>
					</div>
				</div>
			</div>
		</>
	);

	const manualClaim = (
		<>
			<InputGroup
				type='text'
				value={nodeUri}
				onChange={onSetNodeUri}
				id={'node-uri'}
				placeholder={'nodeid@ip:port'}
				label={'Node URI'}
				// error={formErrors.remoteBalance}
				tooltip={{
					title: 'How to claim manually',
					body: 'Paste your node ID, IP, and port information here to initiate the channel connection manually.'
				}}
			/>
			<Checkbox isChecked={isPrivate} setIsChecked={setIsPrivate}>
				Private channel
			</Checkbox>
			<div className={'claim-channel-manual-action-buttons-container'}>
				<ActionButton onClick={claimChannel} Icon={LightningIcon}>
					{isSubmitting ? 'Opening channel...' : 'Open channel'}
				</ActionButton>
				<div className={'claim-channel-button-spacer'} />
				<ActionButton onClick={() => setShowManual(false)} Icon={QRIcon}>
					Claim automatically
				</ActionButton>
			</div>
			<Divider />
		</>
	);

	return (
		<FormCard
			title={'New Lightning Channel'}
			pageIndicator={{ total: 4, active: 3 }}
			showLightningIcon
		>
			<Heading>{showManual ? 'Claim manually' : 'Claim channel'}</Heading>
			<Divider className={'claim-channel-top-divider'} />
			<div className='claim-channel-container'>
				{showManual ? manualClaim : autoClaim}
				<div className={'claim-channel-middle'}>
					<div className={'claim-channel-middle-col'}>
						<div className={'claim-channel-title-container'}>
							<span className={'claim-channel-title'}>Inbound capacity</span>
							<span className={'channel-claim-fiat-conversion'}>
								${inboundDisplay.fiatWhole}
								<span className={'decimal'}>
									{inboundDisplay.fiatDecimal}
									{inboundDisplay.fiatDecimalValue}
								</span>
							</span>
						</div>
						<span className={'claim-channel-middle-value'}>
							<LightningIconActive className={'claim-channel-middle-value-icon'} />
							{inboundDisplay.bitcoinFormatted}
						</span>
					</div>
					<div className={'claim-channel-middle-col'}>
						<div className={'claim-channel-title-container'}>
							<span className={'claim-channel-title'}>My balance</span>
							<span className={'channel-claim-fiat-conversion'}>
								${myBalanceDisplay.fiatWhole}
								<span className={'decimal'}>
									{myBalanceDisplay.fiatDecimal}
									{myBalanceDisplay.fiatDecimalValue}
								</span>
							</span>
						</div>
						<span className={'claim-channel-middle-value'}>
							<LightningIconActive className={'claim-channel-middle-value-icon'} />
							{myBalanceDisplay.bitcoinFormatted}
						</span>
					</div>
				</div>

				<p className={'claim-channel-bottom-message'}>
					This channel will stay open for at least{' '}
					<span className={'highlight'}>
						{channel_expiry} week
						{channel_expiry !== 1 ? 's' : ''}
					</span>
					.
				</p>
			</div>
		</FormCard>
	);
}

export default ClaimPage;
