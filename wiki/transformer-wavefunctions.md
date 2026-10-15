# Transformer wavefunctions

> **In brief.** A transformer wavefunction embeds the sites, or patches of sites, of a configuration into vectors and mixes them with self-attention, so that every amplitude is computed from all-to-all interactions between patches in a fixed number of layers. The vision-transformer (ViT) variant with attention weights that depend only on the relative position of two patches is translation-invariant by construction, holds the best variational energies on the $10\times10$ J₁–J₂ torus and on triangular tori up to $42\times42$, and serves as the backbone of the leading fermionic backflow states. Its cost is quadratic in the number of patches, and it became trainable at $10^5$ to $10^6$ parameters only with the kernel formulation of stochastic reconfiguration.

Notation follows the [conventions page](../notation/).

## Definition

Split the configuration $\boldsymbol\sigma=(\sigma_1,\dots,\sigma_N)$ into $n$ patches $\mathbf x_i$ of $b$ sites each ($b\times b$ squares on a square lattice), and embed each patch linearly into $\mathbb R^d$. A self-attention layer maps the sequence $(\mathbf x_1,\dots,\mathbf x_n)$ to

$$
\mathbf A_i=\sum_{j=1}^{n}\alpha_{ij}\,V\mathbf x_j ,
$$

with a value matrix $V$ and attention weights $\alpha_{ij}$. In the standard transformer the weights are a softmax of dot products between queries $Q\mathbf x_i$ and keys $K\mathbf x_j$, so they depend on the content of the patches. The ViT wavefunction of Viteritti, Rende and Becca (arXiv:2211.05504) drops the queries and keys and takes

$$
\alpha^{\mu}_{ij}=\alpha^{\mu}_{i-j},
$$

a trainable function of the relative position only, separately for each of $h$ heads $\mu$. The heads are computed in parallel with $V^\mu$ of size $(d/h)\times b$, concatenated, and projected linearly; each output vector then passes through a nonlinearity. In the original single-layer form the nonlinearity was $\log\cosh$ with complex parameters and the output was the sum over patches. In the deep form used since (Rende et al., arXiv:2310.05715), each layer is a pre-layer-normalized attention block followed by a two-layer feed-forward network of hidden width $2d$ with ReLU activations, with skip connections, repeated $n_l$ times; the hidden layers are real, and a final complex linear layer applied to $\mathbf z=\sum_i\mathbf y_i$ returns $\log\Psi_\theta(\boldsymbol\sigma)$, modulus and phase together. Patch size, embedding dimension, number of heads and depth are the hyperparameters: for the $10\times10$ J₁–J₂ model, $b=2$, $d=72$, $h=12$, $n_l=8$ give $267\,720$ real parameters (arXiv:2310.05715); the same $d$, $h$ and $n_l$ give about $4.5\times10^5$ parameters on triangular tori from $18\times18$ to $42\times42$ (arXiv:2602.02665).

The choice $\alpha_{ij}=\alpha_{i-j}$ is the physical content of the architecture. It says that how much patch $j$ contributes to the representation of patch $i$ depends on their separation, not on their spins; the spins enter through the values $V\mathbf x_j$. It also reduces the attention parameters from $O(n^2)$ to $O(n)$ and makes the network equivariant under translations by whole patches. Queries and keys were found not to improve the energies on these problems (arXiv:2310.05715).

## Symmetries

- **Translations by whole patches** are built in by the relative attention weights. Translations within a patch are restored by summing $\Psi_{\mathrm{ViT}}(T_r\boldsymbol\sigma)$ over the $b$ (or $b^2$) sub-patch translations $T_r$, which is a quantum-number projection onto $\mathbf k=0$ at the cost of $b^2$ evaluations rather than $N$.
- **Point group.** Rotations and reflections are restored by projection after optimization, one symmetry at a time: the network is first optimized with patch translations only, then the full translation group, then rotations, then reflections are added as group averages, each stage starting from the previous parameters (arXiv:2310.05715, Fig. 1). The gain from each stage is a direct measure of how much symmetry the unprojected state was breaking; on the $20\times20$ J₁–J₂ torus the energies are $-0.496375(1)$, $-0.496698(1)$ and $-0.496732(1)$ for no symmetry, translations, and full $C_{4v}$ (arXiv:2602.02665, Sec. V B).
- **Spin flip and $U(1)$.** The $S^z=0$ sector is fixed by sampling; spin-flip parity, when used, is a two-element group average.

## Spatial attention

For large lattices the optimized attention weights decay with distance, but learning that decay from a random initialization becomes harder as $n$ grows. Viteritti, Rende, Sachdev and Carleo (arXiv:2602.02665) multiply the weights by a distance kernel,

$$
\mathbf A_i=\sum_{j=1}^{n}\frac{e^{-\gamma\,d(i,j)}}{\sum_{j'}e^{-\gamma\,d(i,j')}}\;\alpha_{ij}\,V\mathbf x_j ,
$$

with $d(i,j)$ the Euclidean distance between patches and one trainable inverse length $\gamma>0$ per head and layer. The architecture reduces to the previous one as $\gamma\to0$, keeps the global receptive field, and each head can learn its own correlation scale. This is the change that made $42\times42$ triangular tori optimizable, and the ansatz on which the thermodynamic-limit analysis of the [triangular benchmark](../triangular-heisenberg/) rests.

## Cost and optimization

One evaluation costs $O(n_l\,n^2d)$ for the attention and $O(n_l\,nd^2)$ for the feed-forward parts, with $n=N/b^2$. The quadratic term is the price of all-to-all mixing; for $N=1764$ and $b^2=9$ it is $n^2\approx4\times10^4$ per layer, affordable on GPUs. Local-update ratios for the local energy are not cheaper than full evaluations, unlike for an RBM, so the local energy of a Heisenberg model costs $O(N)$ full passes, batched.

Transformers with $10^5$ or more parameters cannot be optimized by stochastic reconfiguration in its $P\times P$ form. The kernel formulation, which inverts an $M\times M$ (or $2M\times2M$ for complex outputs) matrix with $M$ the number of samples, was introduced for exactly this architecture (arXiv:2310.05715; Chen and Heyl, arXiv:2302.01941), see the [optimization page](../optimization/). The $10\times10$ J₁–J₂ state was optimized with $M=6000$ samples, a learning rate of $0.03$ with cosine decay, and about four days on twenty A100 GPUs. Deep transformers in the original complex $\log\cosh$ form needed a curriculum in which the attention is cut off beyond a range that is progressively relaxed (arXiv:2211.05504, Fig. 6); spatial attention replaces that curriculum with a learned range.

## Results

- **One-dimensional J₁–J₂ chain, 100 sites.** A single layer with $h=8$ heads and $d/h=1$ reaches relative energy errors of about $10^{-4}$ at $J_2/J_1=0.4$ and below $10^{-3}$ at $J_2/J_1=0.8$ against DMRG, with correlation functions and dimer order reproduced, and no Marshall prior (arXiv:2211.05504).
- **$10\times10$ J₁–J₂ at $J_2/J_1=0.5$.** The symmetrized deep ViT gives $e=-0.497634(1)$, the lowest variational energy on the instance at the time, with no sign prior (arXiv:2310.05715, Table 1). See the [benchmark page](../j1j2-square-lattice/).
- **$20\times20$ J₁–J₂ at $J_2/J_1=0.5$.** $e=-0.496732(1)$ with $C_{4v}$ projection, below the residual convolutional networks on the same cluster (arXiv:2602.02665).
- **Triangular tori.** $e=-0.551703(1)$, $-0.551602(1)$, $-0.551528(1)$ and $-0.551429(1)$ for $L=18,24,30,42$, a thermodynamic-limit energy $-0.55168(2)$ and a magnetization $M_0=0.148(1)$ (arXiv:2602.02665, Table I).
- **Fermions.** A ViT is the backbone of hidden-fermion and Jastrow–backflow determinant states (Sharma et al., arXiv:2510.11710), of the transformer backflow states compared on the $8\times8$ t–t′ Hubbard torus (Viteritti et al., arXiv:2604.21978), of the transformer neural backflow of Gu et al. (arXiv:2507.02644), and of the symmetry-preserving backflow pairing state that reaches $24\times24$ (Rende, Viteritti, Georges, arXiv:2608.12465); see the [fermionic states page](../fermionic-neural-states/).

## Autoregressive transformers

A different family keeps the decoder structure of language models: the network outputs, site by site, a normalized conditional distribution and a phase, so that $\vert\Psi\vert^2$ can be sampled exactly without a Markov chain. The transformer quantum state of Zhang and Di Ventra conditions the network on the Hamiltonian parameters and learns a whole phase diagram with one model (arXiv:2208.01758); the large patched transformers of Sprague and Czischek take patches of Rydberg atoms as tokens and exceed the accuracy of recurrent networks and of quantum Monte Carlo reference data on two-dimensional arrays (arXiv:2306.03921). The autoregressive constraint fixes a site ordering and makes sampling sequential; see the [autoregressive page](../autoregressive-networks/). The ViT wavefunctions above are not autoregressive: they are unnormalized, symmetric, and sampled by Metropolis.

## References

- L. L. Viteritti, R. Rende, F. Becca, *Transformer variational wave functions for frustrated quantum spin systems*, arXiv:2211.05504 (2022). The ViT wavefunction with position-only attention; one-dimensional J₁–J₂ results; the deep-ViT curriculum.
- R. Rende, L. L. Viteritti, L. Bardone, F. Becca, S. Goldt, *A simple linear algebra identity to optimize large-scale neural network quantum states*, arXiv:2310.05715 (2023). Kernel SR; the deep ViT and the $10\times10$ J₁–J₂ energy; sequential symmetry restoration.
- L. L. Viteritti, R. Rende, S. Sachdev, G. Carleo, *Approaching the thermodynamic limit with neural-network quantum states*, arXiv:2602.02665 (2026). Spatial attention; triangular tori to $42\times42$; $20\times20$ J₁–J₂.
- A. Chen, M. Heyl, *Empowering deep neural quantum states through efficient optimization*, arXiv:2302.01941 (2023). MinSR, the optimizer that made deep architectures trainable.
- Y.-H. Zhang, M. Di Ventra, *Transformer quantum state: a multi-purpose model for quantum many-body problems*, arXiv:2208.01758 (2022).
- K. Sprague, S. Czischek, *Variational Monte Carlo with large patched transformers*, arXiv:2306.03921 (2023).
- L. Sharma, A. Shokry, R. Nutakki, O. Simard, M. Ferrero, F. Vicentini, *Comparing symmetrized determinant neural quantum states for the Hubbard model*, arXiv:2510.11710 (2025). ViT backbones for determinant states.
- Y. Gu et al., *Solving the Hubbard model with neural quantum states*, arXiv:2507.02644 (2025). Transformer neural backflow.
- L. L. Viteritti, R. Rende, C. Roth, A. Sengupta, G. Carleo, A. Georges, *Beyond variational bias: resolving intertwined orders in the Hubbard model*, arXiv:2604.21978 (2026).
- R. Rende, L. L. Viteritti, A. Georges, *Superconductivity in the t–t′ Hubbard model from symmetry-preserving neural-network quantum states*, arXiv:2608.12465 (2026).
