export function PeerlistBadge({ className }: { className?: string }) {
	return (
		<a
			href="https://peerlist.io/areeburrub/project/youruniquecv"
			target="_blank"
			rel="noreferrer"
			className={className}
		>
			<img
				src="https://peerlist.io/api/v1/projects/embed/PRJHEOGPB77KQO7BPCBMBL8LQPJLPJ?showUpvote=true&theme=light"
				alt="YourUnique.cv"
				className="h-[72px] w-auto dark:hidden"
			/>
			<img
				src="https://peerlist.io/api/v1/projects/embed/PRJHEOGPB77KQO7BPCBMBL8LQPJLPJ?showUpvote=true&theme=dark"
				alt="YourUnique.cv"
				className="hidden h-[72px] w-auto dark:block"
			/>
		</a>
	);
}
