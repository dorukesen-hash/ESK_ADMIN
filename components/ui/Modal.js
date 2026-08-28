"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }) {
	return (
		<Transition show={open} as={Fragment}>
			<Dialog onClose={onClose} className="relative z-50">
				<Transition.Child
					as={Fragment}
					enter="ease-out duration-150"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-100"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="fixed inset-0 bg-black/40" aria-hidden="true" />
				</Transition.Child>

				<div className="fixed inset-0 flex items-center justify-center p-4">
					<Transition.Child
						as={Fragment}
						enter="ease-out duration-150"
						enterFrom="opacity-0 scale-95"
						enterTo="opacity-100 scale-100"
						leave="ease-in duration-100"
						leaveFrom="opacity-100 scale-100"
						leaveTo="opacity-0 scale-95"
					>
						<Dialog.Panel className={`w-full ${maxWidth} bg-white p-6 shadow-custom`}>
							<div className="flex items-center justify-between">
								<Dialog.Title className="font-montserrat text-lg font-semibold text-text-dark">
									{title}
								</Dialog.Title>
								<button
									type="button"
									onClick={onClose}
									className="text-text-light transition hover:text-text-dark"
								>
									<X size={18} />
								</button>
							</div>
							<div className="mt-4">{children}</div>
						</Dialog.Panel>
					</Transition.Child>
				</div>
			</Dialog>
		</Transition>
	);
}
